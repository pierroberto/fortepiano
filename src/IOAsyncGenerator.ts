import * as Appli from 'fp-ts/Applicative'
import * as _Apply from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as Co from 'fp-ts/Compactable'
import * as Ei from 'fp-ts/Either'
import * as Eq from 'fp-ts/Eq'
import * as Fi from 'fp-ts/Filterable'
import * as FiWI from 'fp-ts/FilterableWithIndex'
import * as FIO from 'fp-ts/FromIO'
import {
  constFalse,
  constTrue,
  flip,
  flow,
  Lazy,
  not,
  pipe,
  Predicate,
  Refinement,
} from 'fp-ts/function'
import * as Fu from 'fp-ts/Functor'
import * as FuWI from 'fp-ts/FunctorWithIndex'
import * as IO from 'fp-ts/IO'
import * as Mona from 'fp-ts/Monad'
import * as MIO from 'fp-ts/MonadIO'
import * as Mono from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import * as P from 'fp-ts/Pointed'
import * as RA from 'fp-ts/ReadonlyArray'
import * as S from 'fp-ts/Separated'
import * as T from 'fp-ts/Task'
import { curry } from './function'
import * as $IOG from './GeneratorL'

export const URI = 'IOAsyncGenerator'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: IOAsyncGenerator<A>
  }
}

export type IOAsyncGenerator<A> = IO.IO<AsyncGenerator<A>>

export const getMonoid = <A>(): Mono.Monoid<IOAsyncGenerator<A>> => ({
  empty: fromReadonlyArray([]),
  concat: (x, y) =>
    async function* () {
      yield* x()
      yield* y()
    },
})

export const fromIOGenerator = <A>(
  as: $IOG.GeneratorL<A>,
): IOAsyncGenerator<A> =>
  async function* () {
    for (const a of as()) {
      yield a
    }
  }

export const Functor: Fu.Functor1<URI> = {
  URI,
  map: (fa, f) =>
    async function* () {
      for await (const a of fa()) {
        yield f(a)
      }
    },
}

export const map = curry(flip(Functor.map))
export const flap = Fu.flap(Functor)
export const bindTo = Fu.bindTo(Functor)

export const FunctorWithIndex: FuWI.FunctorWithIndex1<URI, number> = {
  ...Functor,
  mapWithIndex: (fa, f) =>
    Functor.map(pipe(fa, zip(range(0))), ([a, i]) => f(i, a)),
}

export const Pointed: P.Pointed1<URI> = {
  URI,
  of: (a) => fromIOGenerator($IOG.of(a)),
}

export const of = Pointed.of
export const Do = Pointed.of({})

export const ApplyPar: _Apply.Apply1<URI> = {
  ...Functor,
  ap: (fab, fa) =>
    async function* () {
      const _fab = fab()
      const _fa = fa()
      const abs = []
      const as = []
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [ab, a] = await Promise.all([_fab.next(), _fa.next()])
        if (ab.done && a.done) {
          break
        }

        if (!ab.done) {
          abs.push(ab.value)
        }
        if (!a.done) {
          as.push(a.value)
        }
      }

      for (const ab of abs) {
        for (const a of as) {
          yield ab(a)
        }
      }
    },
}

/**
 *
 */

export const ApplySeq: _Apply.Apply1<URI> = {
  ...Functor,
  ap: (fab, fa) =>
    async function* () {
      const abs = []
      for await (const ab of fab()) {
        abs.push(ab)
      }
      const as = []
      for await (const a of fa()) {
        as.push(a)
      }

      for (const ab of abs) {
        for (const a of as) {
          yield ab(a)
        }
      }
    },
}

export const ap = curry(flip(ApplyPar.ap))
export const apFirst = _Apply.apFirst(ApplyPar)
export const apSecond = _Apply.apSecond(ApplyPar)
export const apS = _Apply.apS(ApplyPar)

export const ApplicativePar: Appli.Applicative1<URI> = {
  ...Pointed,
  ...ApplyPar,
}

export const ApplicativeSeq: Appli.Applicative1<URI> = {
  ...Pointed,
  ...ApplySeq,
}

export const Chain: Ch.Chain1<URI> = {
  ...ApplySeq,
  chain: (fa, f) => {
    return flatten(Functor.map(fa, f))
  },
}

export const chain = curry(flip(Chain.chain))
export const chainFirst = Ch.chainFirst(Chain)
export const bind = Ch.bind(Chain)

export const Monad: Mona.Monad1<URI> = { ...ApplicativeSeq, ...Chain }

export const FromIO: FIO.FromIO1<URI> = {
  URI,
  fromIO: (fa) => () => Pointed.of(fa())(),
}

export const fromIO = FromIO.fromIO
export const fromIOK = FIO.fromIOK(FromIO)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)

export const fromIOReadonlyArray = <A>(
  fa: IO.IO<ReadonlyArray<A>>,
): IOAsyncGenerator<A> => pipe(fa, fromIO, chain(fromReadonlyArray))

export const fromIOReadonlyArrayK = <A extends ReadonlyArray<unknown>, B>(
  f: (...a: A) => IO.IO<ReadonlyArray<B>>,
) => flow(f, fromIOReadonlyArray)

export const chainIOReadonlyArrayK = <A, B>(
  f: (a: A) => IO.IO<ReadonlyArray<B>>,
) => chain(fromIOReadonlyArrayK(f))

export const MonadIO: MIO.MonadIO1<URI> = { ...Monad, ...FromIO }

function _filter<A, B extends A>(
  fa: IOAsyncGenerator<A>,
  refinement: Refinement<A, B>,
): IOAsyncGenerator<B>
function _filter<A>(
  fa: IOAsyncGenerator<A>,
  predicate: Predicate<A>,
): IOAsyncGenerator<A>
function _filter<A>(fa: IOAsyncGenerator<A>, predicate: Predicate<A>) {
  return async function* () {
    for await (const a of fa()) {
      if (!predicate(a)) {
        continue
      }

      yield a
    }
  }
}

export const Compactable: Co.Compactable1<URI> = {
  URI,
  compact: (fa) => Functor.map(Filterable.filter(fa, O.isSome), (a) => a.value),
  separate: (fa) =>
    S.separated(
      Functor.map(_filter(fa, Ei.isLeft), (a) => a.left),
      Functor.map(_filter(fa, Ei.isRight), (a) => a.right),
    ),
}

export const compact = Compactable.compact
export const separate = Compactable.separate

function _partition<A, B extends A>(
  fa: IOAsyncGenerator<A>,
  refinement: Refinement<A, B>,
): S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<B>>
function _partition<A>(
  fa: IOAsyncGenerator<A>,
  predicate: Predicate<A>,
): S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<A>>
function _partition<A>(fa: IOAsyncGenerator<A>, predicate: Predicate<A>) {
  return S.separated(_filter(fa, not(predicate)), _filter(fa, predicate))
}

export const Filterable: Fi.Filterable1<URI> = {
  ...Functor,
  ...Compactable,
  filter: _filter,
  filterMap: (fa, f) => Compactable.compact(Functor.map(fa, f)),
  partition: _partition,
  partitionMap: (fa, f) => Compactable.separate(Functor.map(fa, f)),
}

export function filter<A, B extends A>(
  refinement: Refinement<A, B>,
): (fa: IOAsyncGenerator<A>) => IOAsyncGenerator<B>
export function filter<A>(
  predicate: Predicate<A>,
): (fa: IOAsyncGenerator<A>) => IOAsyncGenerator<A>
export function filter<A>(predicate: Predicate<A>) {
  return (fa: IOAsyncGenerator<A>) => Filterable.filter(fa, predicate)
}
export const filterMap = curry(flip(Filterable.filterMap))
export function partition<A, B extends A>(
  refinement: Refinement<A, B>,
): (
  fa: IOAsyncGenerator<A>,
) => S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<B>>
export function partition<A>(
  predicate: Predicate<A>,
): (
  fa: IOAsyncGenerator<A>,
) => S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<A>>
export function partition<A>(predicate: Predicate<A>) {
  return (fa: IOAsyncGenerator<A>) => Filterable.partition(fa, predicate)
}
export const partitionMap = curry(flip(Filterable.partitionMap))

function _filterWithIndex<A, B extends A>(
  fa: IOAsyncGenerator<A>,
  refinementWithIndex: (i: number, a: A) => a is B,
): IOAsyncGenerator<B>
function _filterWithIndex<A>(
  fa: IOAsyncGenerator<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
): IOAsyncGenerator<A>
function _filterWithIndex<A>(
  fa: IOAsyncGenerator<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return Compactable.compact(
    FunctorWithIndex.mapWithIndex(fa, (i, a) =>
      predicateWithIndex(i, a) ? O.some(a) : O.none,
    ),
  )
}

function _partitionWithIndex<A, B extends A>(
  fa: IOAsyncGenerator<A>,
  refinementWithIndex: (i: number, a: A) => a is B,
): S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<B>>
function _partitionWithIndex<A>(
  fa: IOAsyncGenerator<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
): S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<A>>
function _partitionWithIndex<A>(
  fa: IOAsyncGenerator<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return Compactable.separate(
    FunctorWithIndex.mapWithIndex(fa, (i, a) =>
      predicateWithIndex(i, a) ? Ei.right(a) : Ei.left(a),
    ),
  )
}

export const FilterableWithIndex: FiWI.FilterableWithIndex1<URI, number> = {
  ...FunctorWithIndex,
  ...Filterable,
  filterWithIndex: _filterWithIndex,
  filterMapWithIndex: (fa, f) =>
    Compactable.compact(FunctorWithIndex.mapWithIndex(fa, f)),
  partitionWithIndex: _partitionWithIndex,
  partitionMapWithIndex: (fa, f) =>
    Compactable.separate(FunctorWithIndex.mapWithIndex(fa, f)),
}

export function filterWithIndex<A, B extends A>(
  refinementWithIndex: (i: number, a: A) => a is B,
): (fa: IOAsyncGenerator<A>) => IOAsyncGenerator<B>
export function filterWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
): (fa: IOAsyncGenerator<A>) => IOAsyncGenerator<A>
export function filterWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return (fa: IOAsyncGenerator<A>) =>
    FilterableWithIndex.filterWithIndex(fa, predicateWithIndex)
}
export const filterMapWithIndex = curry(
  flip(FilterableWithIndex.filterMapWithIndex),
)
export function partitionWithIndex<A, B extends A>(
  refinementWithIndex: (i: number, a: A) => a is B,
): (
  fa: IOAsyncGenerator<A>,
) => S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<B>>
export function partitionWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
): (
  fa: IOAsyncGenerator<A>,
) => S.Separated<IOAsyncGenerator<A>, IOAsyncGenerator<A>>
export function partitionWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return (fa: IOAsyncGenerator<A>) =>
    FilterableWithIndex.partitionWithIndex(fa, predicateWithIndex)
}
export const partitionMapWithIndex = curry(
  flip(FilterableWithIndex.partitionMapWithIndex),
)

export const range = flow($IOG.range, fromIOGenerator)
export const replicate = flow($IOG.replicate, fromIOGenerator)
export const fromReadonlyArray = <A>(x: ReadonlyArray<A>) => {
  return flow($IOG.fromReadonlyArray, fromIOGenerator)(x)
}

export const sieve =
  <A>(f: (init: ReadonlyArray<A>, a: A) => boolean) =>
  (as: IOAsyncGenerator<A>): IOAsyncGenerator<A> =>
    async function* () {
      const init: Array<A> = []
      for await (const a of as()) {
        if (!f(init, a)) {
          continue
        }

        init.push(a)
        yield a
      }
    }

export const prime: IOAsyncGenerator<number> = pipe(
  range(2),
  sieve((init, a) =>
    pipe(
      init,
      RA.every((_a) => 0 !== a % _a),
    ),
  ),
)

export const exp: IOAsyncGenerator<number> = pipe(
  range(0),
  map((n) => Math.exp(n)),
)

export const fibonacci: IOAsyncGenerator<number> = async function* () {
  for (let as = [1, 0] as [number, number]; true; as = [as[1], as[0] + as[1]]) {
    yield as[1]
  }
}

export const flatten = <A>(
  as: IOAsyncGenerator<IOAsyncGenerator<A>>,
): IOAsyncGenerator<A> =>
  async function* () {
    for await (const a of as()) {
      yield* a()
    }
  }

export const take =
  <A>(n: number) =>
  (as: IOAsyncGenerator<A>): IOAsyncGenerator<A> =>
    async function* () {
      for await (const [a, i] of pipe(as, zip(range(0)))()) {
        if (i >= n) {
          break
        }

        yield a
      }
    }

export const drop =
  <A>(n: number) =>
  (as: IOAsyncGenerator<A>): IOAsyncGenerator<A> =>
    async function* () {
      for await (const [a, i] of pipe(as, zip(range(0)))()) {
        if (i < n) {
          continue
        }

        yield a
      }
    }

export const zip =
  <A, B>(bs: IOAsyncGenerator<B>) =>
  (as: IOAsyncGenerator<A>): IOAsyncGenerator<Readonly<[A, B]>> =>
    async function* () {
      const _bs = bs()
      for await (const a of as()) {
        const b = await _bs.next()
        if (b.done) {
          break
        }

        yield [a, b.value] as const
      }
    }

export const uniq = <A>(E: Eq.Eq<A>) =>
  sieve<A>((init, a) => !pipe(init, RA.elem(E)(a)))

export const match =
  <A, B>(
    onEmpty: Lazy<B>,
    onNonEmpty: (head: A, tail: IOAsyncGenerator<A>) => B,
  ) =>
  (as: IOAsyncGenerator<A>): T.Task<B> =>
    pipe(
      as().next(),
      (a) => () =>
        a.then((_a) =>
          _a.done ? onEmpty() : onNonEmpty(_a.value, pipe(as, drop(1))),
        ),
    )

export const toTask =
  <A>(as: IOAsyncGenerator<A>): T.Task<ReadonlyArray<A>> =>
  async () => {
    const _as: Array<A> = []
    for await (const a of as()) {
      _as.push(a)
    }

    return _as
  }

export const isEmpty = match(constTrue, constFalse)

export const isNonEmpty = flow(
  isEmpty,
  T.map((a) => !a),
)

export const lookup =
  <A>(i: number) =>
  (as: IOAsyncGenerator<A>): T.Task<O.Option<A>> =>
    i < 0
      ? T.of(O.none)
      : pipe(
          as,
          drop(i),
          match(
            () => O.none,
            (a) => O.some(a),
          ),
        )

export const head = <A>(as: IOAsyncGenerator<A>): T.Task<O.Option<A>> =>
  pipe(as, lookup(0))

export function find<A, B extends A>(
  refinement: Refinement<A, B>,
): (as: IOAsyncGenerator<A>) => T.Task<O.Option<B>>
export function find<A>(
  predicate: Predicate<A>,
): (as: IOAsyncGenerator<A>) => T.Task<O.Option<A>>
export function find<A>(predicate: Predicate<A>) {
  return (as: IOAsyncGenerator<A>) => async () => {
    for await (const a of as()) {
      if (predicate(a)) {
        return O.some(a)
      }
    }

    return O.none
  }
}

export const elem =
  <A>(Eq: Eq.Eq<A>) =>
  (a: A) =>
    find((_a: A) => Eq.equals(a, _a))
