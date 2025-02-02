import * as $generatorL from 'fp-ts/Alt'
import * as Alte from 'fp-ts/Alternative'
import * as Appli from 'fp-ts/Applicative'
import * as _Apply from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as Co from 'fp-ts/Compactable'
import * as Ei from 'fp-ts/Either'
import * as Eq from 'fp-ts/Eq'
import * as Ex from 'fp-ts/Extend'
import * as Fi from 'fp-ts/Filterable'
import * as FiWI from 'fp-ts/FilterableWithIndex'
import * as Fo from 'fp-ts/Foldable'
import * as FoWI from 'fp-ts/FoldableWithIndex'
import * as FIO from 'fp-ts/FromIO'
import {
  constFalse,
  constTrue,
  flip,
  flow,
  identity,
  Lazy,
  not,
  pipe,
  Predicate,
  Refinement,
} from 'fp-ts/function'
import * as Fu from 'fp-ts/Functor'
import * as FuWI from 'fp-ts/FunctorWithIndex'
import {
  HKT,
  Kind,
  Kind2,
  Kind3,
  Kind4,
  URIS,
  URIS2,
  URIS3,
  URIS4,
} from 'fp-ts/HKT'
import * as IO from 'fp-ts/IO'
import * as Mona from 'fp-ts/Monad'
import * as MIO from 'fp-ts/MonadIO'
import * as Mono from 'fp-ts/Monoid'
import * as Op from 'fp-ts/Option'
import * as Or from 'fp-ts/Ord'
import * as P from 'fp-ts/Pointed'
import * as R from 'fp-ts/Random'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as S from 'fp-ts/Separated'
import * as T from 'fp-ts/Traversable'
import * as TWI from 'fp-ts/TraversableWithIndex'
import * as U from 'fp-ts/Unfoldable'
import * as W from 'fp-ts/Witherable'
import { Int } from 'io-ts'
import { curry } from './function'

export const URI = 'GeneratorL'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: GeneratorL<A>
  }
}

export type GeneratorL<A> = Lazy<Generator<A>>

export const getMonoid = <A>(): Mono.Monoid<GeneratorL<A>> => ({
  empty: fromReadonlyArray([]),
  concat: (x, y) =>
    function* () {
      yield* x()
      yield* y()
    },
})

export const getEq = <A>(E: Eq.Eq<A>): Eq.Eq<GeneratorL<A>> =>
  Eq.fromEquals((x, y) => {
    const bs = y()
    for (const a of x()) {
      const b = bs.next()
      if (b.done || !E.equals(a, b.value)) {
        return false
      }
    }

    return Boolean(bs.next().done)
  })

export const getOrd = <A>(O: Or.Ord<A>): Or.Ord<GeneratorL<A>> =>
  Or.fromCompare((first, second) => {
    const bs = second()
    for (const a of first()) {
      const b = bs.next()
      if (b.done) {
        return 1
      }

      const ordering = O.compare(a, b.value)
      if (0 !== ordering) {
        return ordering
      }
    }

    return !bs.next().done ? -1 : 0
  })

export const Functor: Fu.Functor1<URI> = {
  URI,
  map: (fa, f) =>
    function* () {
      for (const a of fa()) {
        yield f(a)
      }
    },
}

export const map = curry(flip(Functor.map))
export const flap = Fu.flap(Functor)
export const bindTo = Fu.bindTo(Functor)

export const Pointed: P.Pointed1<URI> = {
  URI,
  of: (a) =>
    function* () {
      yield a
    },
}

export const of = Pointed.of
export const Do = Pointed.of({})

export const FunctorWithIndex: FuWI.FunctorWithIndex1<URI, number> = {
  ...Functor,
  mapWithIndex: (fa, f) =>
    Functor.map(pipe(fa, zip(range(0))), ([a, i]) => f(i, a)),
}

export const mapWithIndex = curry(flip(FunctorWithIndex.mapWithIndex))

export const Apply: _Apply.Apply1<URI> = {
  ...Functor,
  ap: (fab, fa) => Chain.chain(fab, curry(Functor.map)(fa)),
}

export const ap = curry(flip(Apply.ap))
export const apFirst = _Apply.apFirst(Apply)
export const apSecond = _Apply.apSecond(Apply)
export const apS = _Apply.apS(Apply)

export const Applicative: Appli.Applicative1<URI> = { ...Pointed, ...Apply }

export const Chain: Ch.Chain1<URI> = {
  ...Apply,
  chain: (fa, f) => flatten(Functor.map(fa, f)),
}

export const chain = curry(flip(Chain.chain))
export const chainFirst = Ch.chainFirst(Chain)
export const bind = Ch.bind(Chain)

export const chainWithIndex =
  <A, B>(f: (i: number, a: A) => GeneratorL<B>) =>
  (fa: GeneratorL<A>): GeneratorL<B> =>
    pipe(
      fa,
      zip(range(0)),
      chain(([a, i]) => f(i, a)),
    )

export const Monad: Mona.Monad1<URI> = { ...Applicative, ...Chain }

export const FromIO: FIO.FromIO1<URI> = {
  URI,
  fromIO: (fa) => pipe(range(0), map(fa)),
}

export const fromIO = FromIO.fromIO
export const fromIOK = FIO.fromIOK(FromIO)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)

export const MonadIO: MIO.MonadIO1<URI> = { ...Monad, ...FromIO }

export const Unfoldable: U.Unfoldable1<URI> = {
  URI,
  unfold: (b, f) =>
    function* () {
      for (
        let _b = b, ab = f(_b);
        Op.isSome(ab);
        _b = ab.value[1], ab = f(_b)
      ) {
        yield ab.value[0]
      }
    },
}

export const unfold = curry(flip(Unfoldable.unfold))

export const Alt: $generatorL.Alt1<URI> = {
  ...Functor,
  alt: <A>(fa: GeneratorL<A>, that: Lazy<GeneratorL<A>>) =>
    getMonoid<A>().concat(fa, that()),
}

export const alt = curry(flip(Alt.alt))

export const Alternative: Alte.Alternative1<URI> = {
  ...Applicative,
  ...Alt,
  zero: <A>() => getMonoid<A>().empty,
}

export const zero = Alternative.zero

export const Extend: Ex.Extend1<URI> = {
  ...Functor,
  extend: (wa, f) =>
    pipe(
      wa,
      mapWithIndex((i) => pipe(wa, dropLeft(i), f)),
    ),
}

export const extend = curry(flip(Extend.extend))
export const duplicate = <A>(fa: GeneratorL<A>) => pipe(fa, extend(identity))

export const Compactable: Co.Compactable1<URI> = {
  URI,
  compact: (fa) =>
    Functor.map(Filterable.filter(fa, Op.isSome), (a) => a.value),
  separate: (fa) =>
    S.separated(
      Functor.map(Filterable.filter(fa, Ei.isLeft), (a) => a.left),
      Functor.map(Filterable.filter(fa, Ei.isRight), (a) => a.right),
    ),
}

export const compact = Compactable.compact
export const separate = Compactable.separate

function _filter<A, B extends A>(
  fa: GeneratorL<A>,
  refinement: Refinement<A, B>,
): GeneratorL<B>
function _filter<A>(fa: GeneratorL<A>, predicate: Predicate<A>): GeneratorL<A>
function _filter<A>(fa: GeneratorL<A>, predicate: Predicate<A>) {
  return function* () {
    for (const a of fa()) {
      if (!predicate(a)) {
        continue
      }

      yield a
    }
  }
}

function _partition<A, B extends A>(
  fa: GeneratorL<A>,
  refinement: Refinement<A, B>,
): S.Separated<GeneratorL<A>, GeneratorL<B>>
function _partition<A>(
  fa: GeneratorL<A>,
  predicate: Predicate<A>,
): S.Separated<GeneratorL<A>, GeneratorL<A>>
function _partition<A>(fa: GeneratorL<A>, predicate: Predicate<A>) {
  return S.separated(
    Filterable.filter(fa, not(predicate)),
    Filterable.filter(fa, predicate),
  )
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
): (fa: GeneratorL<A>) => GeneratorL<B>
export function filter<A>(
  predicate: Predicate<A>,
): (fa: GeneratorL<A>) => GeneratorL<A>
export function filter<A>(predicate: Predicate<A>) {
  return (fa: GeneratorL<A>) => Filterable.filter(fa, predicate)
}
export const filterMap = curry(flip(Filterable.filterMap))
export function partition<A, B extends A>(
  refinement: Refinement<A, B>,
): (fa: GeneratorL<A>) => S.Separated<GeneratorL<A>, GeneratorL<B>>
export function partition<A>(
  predicate: Predicate<A>,
): (fa: GeneratorL<A>) => S.Separated<GeneratorL<A>, GeneratorL<A>>
export function partition<A>(predicate: Predicate<A>) {
  return (fa: GeneratorL<A>) => Filterable.partition(fa, predicate)
}
export const partitionMap = curry(flip(Filterable.partitionMap))

function _filterWithIndex<A, B extends A>(
  fa: GeneratorL<A>,
  refinementWithIndex: (i: number, a: A) => a is B,
): GeneratorL<B>
function _filterWithIndex<A>(
  fa: GeneratorL<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
): GeneratorL<A>
function _filterWithIndex<A>(
  fa: GeneratorL<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return Compactable.compact(
    FunctorWithIndex.mapWithIndex(fa, (i, a) =>
      predicateWithIndex(i, a) ? Op.some(a) : Op.none,
    ),
  )
}

function _partitionWithIndex<A, B extends A>(
  fa: GeneratorL<A>,
  refinementWithIndex: (i: number, a: A) => a is B,
): S.Separated<GeneratorL<A>, GeneratorL<B>>
function _partitionWithIndex<A>(
  fa: GeneratorL<A>,
  predicateWithIndex: (i: number, a: A) => boolean,
): S.Separated<GeneratorL<A>, GeneratorL<A>>
function _partitionWithIndex<A>(
  fa: GeneratorL<A>,
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
): (fa: GeneratorL<A>) => GeneratorL<B>
export function filterWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
): (fa: GeneratorL<A>) => GeneratorL<A>
export function filterWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return (fa: GeneratorL<A>) =>
    FilterableWithIndex.filterWithIndex(fa, predicateWithIndex)
}
export const filterMapWithIndex = curry(
  flip(FilterableWithIndex.filterMapWithIndex),
)
export function partitionWithIndex<A, B extends A>(
  refinementWithIndex: (i: number, a: A) => a is B,
): (fa: GeneratorL<A>) => S.Separated<GeneratorL<A>, GeneratorL<B>>
export function partitionWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
): (fa: GeneratorL<A>) => S.Separated<GeneratorL<A>, GeneratorL<A>>
export function partitionWithIndex<A>(
  predicateWithIndex: (i: number, a: A) => boolean,
) {
  return (fa: GeneratorL<A>) =>
    FilterableWithIndex.partitionWithIndex(fa, predicateWithIndex)
}
export const partitionMapWithIndex = curry(
  flip(FilterableWithIndex.partitionMapWithIndex),
)

export const Foldable: Fo.Foldable1<URI> = {
  URI,
  reduce: (fa, b, f) =>
    FoldableWithIndex.reduceWithIndex(fa, b, (_, _b, a) => f(_b, a)),
  foldMap: (M) => (fa, f) =>
    FoldableWithIndex.foldMapWithIndex(M)(fa, (_, a) => f(a)),
  reduceRight: (fa, b, f) =>
    FoldableWithIndex.reduceRightWithIndex(fa, b, (_, a, _b) => f(a, _b)),
}

export const reduce =
  <A, B>(b: B, f: (b: B, a: A) => B) =>
  (fa: GeneratorL<A>) =>
    Foldable.reduce(fa, b, f)
export const foldMap =
  <M>(M: Mono.Monoid<M>) =>
  <A>(f: (a: A) => M) =>
  (fa: GeneratorL<A>) =>
    Foldable.foldMap(M)(fa, f)
export const reduceRight =
  <A, B>(b: B, f: (a: A, b: B) => B) =>
  (fa: GeneratorL<A>) =>
    Foldable.reduceRight(fa, b, f)

export const FoldableWithIndex: FoWI.FoldableWithIndex1<URI, number> = {
  ...Foldable,
  reduceWithIndex: (fa, b, f) =>
    pipe(fa, zip(range(0)), (_fa) => {
      let _b = b
      for (const [a, i] of _fa()) {
        _b = f(i, _b, a)
      }

      return _b
    }),
  foldMapWithIndex: (M) => (fa, f) =>
    FoldableWithIndex.reduceWithIndex(fa, M.empty, (i, b, a) =>
      M.concat(b, f(i, a)),
    ),
  reduceRightWithIndex: (fa, b, f) =>
    pipe(fa, toReadonlyArray, RA.reduceRightWithIndex(b, f)),
}

export const reduceWithIndex =
  <A, B>(b: B, f: (i: number, b: B, a: A) => B) =>
  (fa: GeneratorL<A>) =>
    FoldableWithIndex.reduceWithIndex(fa, b, f)
export const foldMapWithIndex =
  <M>(M: Mono.Monoid<M>) =>
  <A>(f: (i: number, a: A) => M) =>
  (fa: GeneratorL<A>) =>
    FoldableWithIndex.foldMapWithIndex(M)(fa, f)
export const reduceRightWithIndex =
  <A, B>(b: B, f: (i: number, a: A, b: B) => B) =>
  (fa: GeneratorL<A>) =>
    FoldableWithIndex.reduceRightWithIndex(fa, b, f)

function _traverse<F extends URIS4>(
  F: Appli.Applicative4<F>,
): <A, S, R, E, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind4<F, S, R, E, B>,
) => Kind4<F, S, R, E, GeneratorL<B>>
function _traverse<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, B>,
) => Kind3<F, R, E, GeneratorL<B>>
function _traverse<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, B>,
) => Kind3<F, R, E, GeneratorL<B>>
function _traverse<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, B>,
) => Kind2<F, E, GeneratorL<B>>
function _traverse<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, B>,
) => Kind2<F, E, GeneratorL<B>>
function _traverse<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(ta: GeneratorL<A>, f: (a: A) => Kind<F, B>) => Kind<F, GeneratorL<B>>
function _traverse<F>(F: Appli.Applicative<F>) {
  return <A, B>(ta: GeneratorL<A>, f: (a: A) => HKT<F, B>) =>
    TraversableWithIndex.traverseWithIndex(F)(ta, (_: number, a: A) => f(a))
}

export function sequence<F extends URIS4>(
  F: Appli.Applicative4<F>,
): <S, R, E, A>(
  ta: GeneratorL<Kind4<F, S, R, E, A>>,
) => Kind4<F, S, R, E, GeneratorL<A>>
export function sequence<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <R, E, A>(ta: GeneratorL<Kind3<F, R, E, A>>) => Kind3<F, R, E, GeneratorL<A>>
export function sequence<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <R, A>(ta: GeneratorL<Kind3<F, R, E, A>>) => Kind3<F, R, E, GeneratorL<A>>
export function sequence<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <E, A>(ta: GeneratorL<Kind2<F, E, A>>) => Kind2<F, E, GeneratorL<A>>
export function sequence<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A>(ta: GeneratorL<Kind2<F, E, A>>) => Kind2<F, E, GeneratorL<A>>
export function sequence<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A>(ta: GeneratorL<Kind<F, A>>) => Kind<F, GeneratorL<A>>
export function sequence<F>(
  F: Appli.Applicative<F>,
): <A>(ta: GeneratorL<HKT<F, A>>) => HKT<F, GeneratorL<A>> {
  return <A>(ta: GeneratorL<HKT<F, A>>) => Traversable.traverse(F)(ta, identity)
}

export const Traversable: T.Traversable1<URI> = {
  ...Functor,
  ...Foldable,
  traverse: _traverse,
  sequence,
}

export function traverse<F extends URIS4>(
  F: Appli.Applicative4<F>,
): <A, S, R, E, B>(
  f: (a: A) => Kind4<F, S, R, E, B>,
) => (ta: GeneratorL<A>) => Kind4<F, S, R, E, GeneratorL<B>>
export function traverse<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  f: (a: A) => Kind3<F, R, E, B>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function traverse<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  f: (a: A) => Kind3<F, R, E, B>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function traverse<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  f: (a: A) => Kind2<F, E, B>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function traverse<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  f: (a: A) => Kind2<F, E, B>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function traverse<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(
  f: (a: A) => Kind<F, B>,
) => (ta: GeneratorL<A>) => Kind<F, GeneratorL<B>>
export function traverse<F>(F: Appli.Applicative<F>) {
  return <A, B>(f: (a: A) => HKT<F, B>) =>
    (ta: GeneratorL<A>) =>
      Traversable.traverse(F)(ta, f)
}

function _traverseWithIndex<F extends URIS4>(
  F: Appli.Applicative4<F>,
): <A, S, R, E, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind4<F, S, R, E, B>,
) => Kind4<F, S, R, E, GeneratorL<B>>
function _traverseWithIndex<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind3<F, R, E, B>,
) => Kind3<F, R, E, GeneratorL<B>>
function _traverseWithIndex<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind3<F, R, E, B>,
) => Kind3<F, R, E, GeneratorL<B>>
function _traverseWithIndex<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind2<F, E, B>,
) => Kind2<F, E, GeneratorL<B>>
function _traverseWithIndex<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind2<F, E, B>,
) => Kind2<F, E, GeneratorL<B>>
function _traverseWithIndex<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(
  ta: GeneratorL<A>,
  f: (i: number, a: A) => Kind<F, B>,
) => Kind<F, GeneratorL<B>>
function _traverseWithIndex<F>(F: Appli.Applicative<F>) {
  return <A, B>(ta: GeneratorL<A>, f: (i: number, a: A) => HKT<F, B>) =>
    FoldableWithIndex.reduceWithIndex(ta, F.of(zero<B>()), (i, fbs, a) =>
      F.ap(
        F.map(fbs, (bs) => (b: B) => pipe(bs, append(b))),
        f(i, a),
      ),
    )
}

export const TraversableWithIndex: TWI.TraversableWithIndex1<URI, number> = {
  ...FunctorWithIndex,
  ...FoldableWithIndex,
  ...Traversable,
  traverseWithIndex: _traverseWithIndex,
}

export function traverseWithIndex<F extends URIS4>(
  F: Appli.Applicative4<F>,
): <A, S, R, E, B>(
  f: (i: number, a: A) => Kind4<F, S, R, E, B>,
) => (ta: GeneratorL<A>) => Kind4<F, S, R, E, GeneratorL<B>>
export function traverseWithIndex<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  f: (i: number, a: A) => Kind3<F, R, E, B>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function traverseWithIndex<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  f: (i: number, a: A) => Kind3<F, R, E, B>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function traverseWithIndex<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  f: (i: number, a: A) => Kind2<F, E, B>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function traverseWithIndex<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  f: (i: number, a: A) => Kind2<F, E, B>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function traverseWithIndex<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(
  f: (i: number, a: A) => Kind<F, B>,
) => (ta: GeneratorL<A>) => Kind<F, GeneratorL<B>>
export function traverseWithIndex<F>(F: Appli.Applicative<F>) {
  return <A, B>(f: (i: number, a: A) => HKT<F, B>) =>
    (ta: GeneratorL<A>) =>
      TraversableWithIndex.traverseWithIndex(F)(ta, f)
}

function _wilt<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B, C>(
  wa: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, Ei.Either<B, C>>,
) => Kind3<F, R, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
function _wilt<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B, C>(
  wa: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, Ei.Either<B, C>>,
) => Kind3<F, R, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
function _wilt<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B, C>(
  wa: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, Ei.Either<B, C>>,
) => Kind2<F, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
function _wilt<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B, C>(
  wa: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, Ei.Either<B, C>>,
) => Kind2<F, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
function _wilt<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B, C>(
  wa: GeneratorL<A>,
  f: (a: A) => Kind<F, Ei.Either<B, C>>,
) => Kind<F, S.Separated<GeneratorL<B>, GeneratorL<C>>>
function _wilt<F>(F: Appli.Applicative<F>) {
  return <A, B, C>(wa: GeneratorL<A>, f: (a: A) => HKT<F, Ei.Either<B, C>>) =>
    F.map(Traversable.traverse(F)(wa, f), separate)
}

function _wither<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, Op.Option<B>>,
) => Kind3<F, R, E, GeneratorL<B>>
function _wither<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind3<F, R, E, Op.Option<B>>,
) => Kind3<F, R, E, GeneratorL<B>>
function _wither<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, Op.Option<B>>,
) => Kind2<F, E, GeneratorL<B>>
function _wither<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind2<F, E, Op.Option<B>>,
) => Kind2<F, E, GeneratorL<B>>
function _wither<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(
  ta: GeneratorL<A>,
  f: (a: A) => Kind<F, Op.Option<B>>,
) => Kind<F, GeneratorL<B>>
function _wither<F>(F: Appli.Applicative<F>) {
  return <A, B>(ta: GeneratorL<A>, f: (a: A) => HKT<F, Op.Option<B>>) =>
    F.map(Traversable.traverse(F)(ta, f), compact)
}

export const Witherable: W.Witherable1<URI> = {
  ...Traversable,
  ...Filterable,
  wilt: _wilt,
  wither: _wither,
}

export function wilt<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B, C>(
  f: (a: A) => Kind3<F, R, E, Ei.Either<B, C>>,
) => (
  wa: GeneratorL<A>,
) => Kind3<F, R, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
export function wilt<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B, C>(
  f: (a: A) => Kind3<F, R, E, Ei.Either<B, C>>,
) => (
  wa: GeneratorL<A>,
) => Kind3<F, R, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
export function wilt<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B, C>(
  f: (a: A) => Kind2<F, E, Ei.Either<B, C>>,
) => (
  wa: GeneratorL<A>,
) => Kind2<F, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
export function wilt<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B, C>(
  f: (a: A) => Kind2<F, E, Ei.Either<B, C>>,
) => (
  wa: GeneratorL<A>,
) => Kind2<F, E, S.Separated<GeneratorL<B>, GeneratorL<C>>>
export function wilt<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B, C>(
  f: (a: A) => Kind<F, Ei.Either<B, C>>,
) => (wa: GeneratorL<A>) => Kind<F, S.Separated<GeneratorL<B>, GeneratorL<C>>>
export function wilt<F>(F: Appli.Applicative<F>) {
  return <A, B, C>(f: (a: A) => HKT<F, Ei.Either<B, C>>) =>
    (wa: GeneratorL<A>) =>
      Witherable.wilt(F)(wa, f)
}
export function wither<F extends URIS3>(
  F: Appli.Applicative3<F>,
): <A, R, E, B>(
  f: (a: A) => Kind3<F, R, E, Op.Option<B>>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function wither<F extends URIS3, E>(
  F: Appli.Applicative3C<F, E>,
): <A, R, B>(
  f: (a: A) => Kind3<F, R, E, Op.Option<B>>,
) => (ta: GeneratorL<A>) => Kind3<F, R, E, GeneratorL<B>>
export function wither<F extends URIS2>(
  F: Appli.Applicative2<F>,
): <A, E, B>(
  f: (a: A) => Kind2<F, E, Op.Option<B>>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function wither<F extends URIS2, E>(
  F: Appli.Applicative2C<F, E>,
): <A, B>(
  f: (a: A) => Kind2<F, E, Op.Option<B>>,
) => (ta: GeneratorL<A>) => Kind2<F, E, GeneratorL<B>>
export function wither<F extends URIS>(
  F: Appli.Applicative1<F>,
): <A, B>(
  f: (a: A) => Kind<F, Op.Option<B>>,
) => (ta: GeneratorL<A>) => Kind<F, GeneratorL<B>>
export function wither<F>(F: Appli.Applicative<F>) {
  return <A, B>(f: (a: A) => HKT<F, Op.Option<B>>) =>
    (ta: GeneratorL<A>) =>
      Witherable.wither(F)(ta, f)
}

export const makeBy = <A>(f: (i: number) => A): GeneratorL<A> =>
  function* () {
    for (let i = 0; true; i++) {
      yield f(i)
    }
  }

export const range = (start: number, end = Infinity): GeneratorL<number> =>
  pipe(
    makeBy((i) => start + i),
    takeLeftWhile((n) => n <= Math.max(start, end)),
  )

export const replicate = <A>(a: A): GeneratorL<A> => makeBy(() => a)

export const fromReadonlyArray = <A>(as: ReadonlyArray<A>): GeneratorL<A> =>
  function* () {
    yield* as
  }

export const fromReadonlyRecord = RR.toUnfoldable(Unfoldable)

export const random: GeneratorL<number> = fromIO(R.random)

export const randomInt = (low: number, high: number): GeneratorL<Int> =>
  fromIO(
    R.randomInt(
      Math.floor(low),
      Math.max(Math.floor(low), Math.floor(high)),
    ) as IO.IO<Int>,
  )

export const randomRange = (min: number, max: number): GeneratorL<number> =>
  fromIO(R.randomRange(min, Math.max(min, max)))

export const randomBool: GeneratorL<boolean> = fromIO(R.randomBool)

export const randomElem = <A>(
  as: RNEA.ReadonlyNonEmptyArray<A>,
): GeneratorL<A> => fromIO(R.randomElem(as))

export const prime: GeneratorL<number> = pipe(
  range(2),
  sieve((init, n) =>
    pipe(
      init,
      RA.every((_n) => 0 !== n % _n),
    ),
  ),
)

export const exp: GeneratorL<number> = makeBy((n) => Math.exp(n))

export const fibonacci: GeneratorL<number> = function* () {
  for (let ns = [1, 0] as [number, number]; true; ns = [ns[1], ns[0] + ns[1]]) {
    yield ns[1]
  }
}

export const flatten = <A>(mma: GeneratorL<GeneratorL<A>>): GeneratorL<A> =>
  function* () {
    for (const ma of mma()) {
      yield* ma()
    }
  }

export const prepend =
  <A>(a: A) =>
  (ma: GeneratorL<A>): GeneratorL<A> =>
    function* () {
      yield a
      yield* ma()
    }

export const append =
  <A>(a: A) =>
  (ma: GeneratorL<A>): GeneratorL<A> =>
    function* () {
      yield* ma()
      yield a
    }

export const takeLeft =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<A> =>
    function* () {
      for (const [a, i] of pipe(ma, zip(range(0)))()) {
        if (i >= n) {
          break
        }

        yield a
      }
    }

export const takeRight =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<A> =>
    pipe(ma, toReadonlyArray, RA.takeRight(n), fromReadonlyArray)

export function takeLeftWhile<A, B extends A>(
  refinement: Refinement<A, B>,
): (ma: GeneratorL<A>) => GeneratorL<B>
export function takeLeftWhile<A>(
  predicate: Predicate<A>,
): (ma: GeneratorL<A>) => GeneratorL<A>
export function takeLeftWhile<A>(predicate: Predicate<A>) {
  return (ma: GeneratorL<A>) =>
    function* () {
      for (const a of ma()) {
        if (!predicate(a)) {
          break
        }

        yield a
      }
    }
}

export const dropLeft =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<A> =>
    function* () {
      for (const [a, i] of pipe(ma, zip(range(0)))()) {
        if (i < n) {
          continue
        }

        yield a
      }
    }

export const dropRight =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<A> =>
    pipe(ma, toReadonlyArray, RA.dropRight(n), fromReadonlyArray)

export function dropLeftWhile<A, B extends A>(
  refinement: Refinement<A, B>,
): (ma: GeneratorL<A>) => GeneratorL<B>
export function dropLeftWhile<A>(
  predicate: Predicate<A>,
): (ma: GeneratorL<A>) => GeneratorL<A>
export function dropLeftWhile<A>(predicate: Predicate<A>) {
  return (ma: GeneratorL<A>) =>
    function* () {
      const as = ma()
      let a = as.next()
      while (!a.done && predicate(a.value)) {
        a = as.next()
      }

      if (!a.done) {
        yield a.value
      }
      yield* as
    }
}

export const scanLeft =
  <A, B>(b: B, f: (b: B, a: A) => B) =>
  (ma: GeneratorL<A>): GeneratorL<B> =>
    function* () {
      yield b
      let _b = b
      for (const a of ma()) {
        _b = f(_b, a)
        yield _b
      }
    }

export const scanRight =
  <A, B>(b: B, f: (a: A, b: B) => B) =>
  (ma: GeneratorL<A>): GeneratorL<B> =>
    pipe(
      ma,
      scanLeft(b, (b, a) => f(a, b)),
      reverse,
    )

export function sieve<A>(f: (init: ReadonlyArray<A>, a: A) => boolean) {
  return (ma: GeneratorL<A>): GeneratorL<A> =>
    function* () {
      const init: Array<A> = []
      for (const a of ma()) {
        if (!f(init, a)) {
          continue
        }

        init.push(a)
        yield a
      }
    }
}

export const uniq = <A>(E: Eq.Eq<A>) =>
  sieve<A>((init, a) => !pipe(init, RA.elem(E)(a)))

export const sort = <B>(O: Or.Ord<B>) => sortBy([O])

export const sortBy =
  <B>(Os: ReadonlyArray<Or.Ord<B>>) =>
  <A extends B>(ma: GeneratorL<A>): GeneratorL<A> =>
    pipe(ma, toReadonlyArray, RA.sortBy(Os), fromReadonlyArray)

export const reverse = <A>(ma: GeneratorL<A>): GeneratorL<A> =>
  function* () {
    const as = toReadonlyArray(ma)
    for (let i = as.length - 1; i >= 0; i--) {
      yield as[i]
    }
  }

export const zipWith =
  <A, B, C>(mb: GeneratorL<B>, f: (a: A, b: B) => C) =>
  (ma: GeneratorL<A>): GeneratorL<C> =>
    function* () {
      const bs = mb()
      for (const a of ma()) {
        const b = bs.next()
        if (b.done) {
          break
        }

        yield f(a, b.value)
      }
    }

export const zip =
  <B>(mb: GeneratorL<B>) =>
  <A>(ma: GeneratorL<A>): GeneratorL<Readonly<[A, B]>> =>
    pipe(
      ma,
      zipWith(mb, (a, b) => [a, b] as const),
    )

export const rights = <E, A>(ma: GeneratorL<Ei.Either<E, A>>): GeneratorL<A> =>
  pipe(ma, filterMap(Op.fromEither))

export const lefts = <E, A>(ma: GeneratorL<Ei.Either<E, A>>): GeneratorL<E> =>
  pipe(
    ma,
    filter(Ei.isLeft),
    map((e) => e.left),
  )

export const prependAll =
  <A>(middle: A) =>
  (ma: GeneratorL<A>): GeneratorL<A> =>
    pipe(
      ma,
      matchLeft(
        () => ma,
        () =>
          function* () {
            for (const a of ma()) {
              yield middle
              yield a
            }
          },
      ),
    )

export const intersperse = <A>(middle: A) =>
  flow(prependAll(middle), dropLeft(1))

export const rotate =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<A> =>
    pipe(ma, toReadonlyArray, RA.rotate(n), fromReadonlyArray)

export const chop =
  <A, B>(f: (ma: GeneratorL<A>) => Readonly<[B, GeneratorL<A>]>) =>
  (ma: GeneratorL<A>): GeneratorL<B> =>
    function* () {
      for (
        let _isNonEmpty = isNonEmpty(ma), [b, _ma] = f(ma);
        _isNonEmpty;
        _isNonEmpty = isNonEmpty(_ma), [b, _ma] = f(_ma)
      ) {
        yield b
      }
    }

export const chunksOf =
  (n: number) =>
  <A>(ma: GeneratorL<A>): GeneratorL<GeneratorL<A>> =>
    pipe(ma, chop(splitAt(Math.max(1, n))))

export const matchLeft =
  <A, B>(onEmpty: Lazy<B>, onNonEmpty: (head: A, tail: GeneratorL<A>) => B) =>
  (ma: GeneratorL<A>): B =>
    pipe(ma().next(), (a) =>
      a.done ? onEmpty() : onNonEmpty(a.value, pipe(ma, dropLeft(1))),
    )

export const matchRight =
  <A, B>(onEmpty: Lazy<B>, onNonEmpty: (init: GeneratorL<A>, last: A) => B) =>
  (ma: GeneratorL<A>): B =>
    pipe(
      ma,
      zip(range(0)),
      last,
      Op.match(onEmpty, ([a, i]) =>
        onNonEmpty(
          pipe(
            ma,
            filterWithIndex((_i) => i !== _i),
          ),
          a,
        ),
      ),
    )

export const toReadonlyArray = <A>(ma: GeneratorL<A>): ReadonlyArray<A> => [
  ...ma(),
]

export const lookup =
  (i: number) =>
  <A>(ma: GeneratorL<A>): Op.Option<A> =>
    i < 0
      ? Op.none
      : pipe(
          ma,
          dropLeft(i),
          matchLeft(() => Op.none, Op.some),
        )

export const head = lookup(0)

export const last = <A>(ma: GeneratorL<A>): Op.Option<A> => {
  let last: Op.Option<A> = Op.none
  for (const a of ma()) {
    last = Op.some(a)
  }

  return last
}

export const tail = <A>(ma: GeneratorL<A>): Op.Option<GeneratorL<A>> =>
  pipe(
    ma,
    matchLeft(
      () => Op.none,
      (_, tail) => Op.some(tail),
    ),
  )

export const init = <A>(ma: GeneratorL<A>): Op.Option<GeneratorL<A>> =>
  pipe(
    ma,
    matchRight(() => Op.none, Op.some),
  )

export interface Spanned<I, R> {
  init: GeneratorL<I>
  rest: GeneratorL<R>
}

export function spanLeft<A, B extends A>(
  refinement: Refinement<A, B>,
): (ma: GeneratorL<A>) => Spanned<B, A>
export function spanLeft<A>(
  predicate: Predicate<A>,
): (ma: GeneratorL<A>) => Spanned<A, A>
export function spanLeft<A>(predicate: Predicate<A>) {
  return (ma: GeneratorL<A>) => {
    const i = pipe(
      ma,
      findFirstIndex(not(predicate)),
      Op.getOrElse(() => Infinity),
    )
    const [init, rest] = pipe(ma, splitAt(i))

    return { init, rest }
  }
}

export const splitAt =
  (n: number) =>
  <A>(ma: GeneratorL<A>): Readonly<[GeneratorL<A>, GeneratorL<A>]> =>
    [pipe(ma, takeLeft(n)), pipe(ma, dropLeft(n))]

export const unzip = <A, B>(
  mab: GeneratorL<Readonly<[A, B]>>,
): Readonly<[GeneratorL<A>, GeneratorL<B>]> => [
  pipe(
    mab,
    map(([a]) => a),
  ),
  pipe(
    mab,
    map(([_, b]) => b),
  ),
]

export const isEmpty = matchLeft(constTrue, constFalse)

export const isNonEmpty = not(isEmpty)

export const size = flow(
  mapWithIndex(identity),
  last,
  Op.match(
    () => 0,
    (i) => 1 + i,
  ),
)

export const isOutOfBound =
  (n: number) =>
  (ma: GeneratorL<unknown>): boolean =>
    n >= 0 && n < size(ma)

export function findFirst<A, B extends A>(
  refinement: Refinement<A, B>,
): (ma: GeneratorL<A>) => Op.Option<B>
export function findFirst<A>(
  predicate: Predicate<A>,
): (ma: GeneratorL<A>) => Op.Option<A>
export function findFirst<A>(predicate: Predicate<A>) {
  return (ma: GeneratorL<A>) => {
    for (const a of ma()) {
      if (predicate(a)) {
        return Op.some(a)
      }
    }

    return Op.none
  }
}

export const findFirstMap =
  <A, B>(f: (a: A) => Op.Option<B>) =>
  (ma: GeneratorL<A>): Op.Option<B> => {
    for (const a of ma()) {
      const b = f(a)
      if (Op.isSome(b)) {
        return b
      }
    }

    return Op.none
  }

export const findFirstIndex =
  <A>(predicate: Predicate<A>) =>
  (ma: GeneratorL<A>): Op.Option<number> =>
    pipe(
      ma,
      zip(range(0)),
      findFirst(([a]) => predicate(a)),
      Op.map(([_, i]) => i),
    )

export function findLast<A, B extends A>(
  refinement: Refinement<A, B>,
): (ma: GeneratorL<A>) => Op.Option<B>
export function findLast<A>(
  predicate: Predicate<A>,
): (ma: GeneratorL<A>) => Op.Option<A>
export function findLast<A>(predicate: Predicate<A>) {
  return (ma: GeneratorL<A>) => pipe(ma, reverse, findFirst(predicate))
}

export const findLastMap =
  <A, B>(f: (a: A) => Op.Option<B>) =>
  (ma: GeneratorL<A>): Op.Option<B> =>
    pipe(ma, reverse, findFirstMap(f))

export const findLastIndex =
  <A>(predicate: Predicate<A>) =>
  (ma: GeneratorL<A>): Op.Option<number> =>
    pipe(
      ma,
      zip(range(0)),
      findLastMap(([a, i]) => (predicate(a) ? Op.some(i) : Op.none)),
    )

export const elem =
  <A>(Eq: Eq.Eq<A>) =>
  (a: A) =>
    findFirst((_a: A) => Eq.equals(a, _a))

export const insertAt =
  <A>(i: number, a: A) =>
  (ma: GeneratorL<A>): Op.Option<GeneratorL<A>> =>
    pipe(
      ma,
      lookup(i),
      Op.map(
        () =>
          function* () {
            for (const [_a, _i] of pipe(ma, zip(range(0)))()) {
              if (i === _i) {
                yield a
              }
              yield _a
            }
          },
      ),
    )

export const modifyAt =
  <A>(i: number, f: (a: A) => A) =>
  (ma: GeneratorL<A>): Op.Option<GeneratorL<A>> =>
    pipe(
      ma,
      lookup(i),
      Op.map(() =>
        pipe(
          ma,
          mapWithIndex((_i, a) => (i === _i ? f(a) : a)),
        ),
      ),
    )

export const updateAt = <A>(i: number, a: A) => modifyAt(i, () => a)

export const deleteAt =
  <A>(i: number) =>
  (ma: GeneratorL<A>): Op.Option<GeneratorL<A>> =>
    pipe(
      ma,
      lookup(i),
      Op.map(() =>
        pipe(
          ma,
          filterWithIndex((_i) => i !== _i),
        ),
      ),
    )
