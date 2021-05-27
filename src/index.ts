import * as $aggregate from './Aggregate'
import * as $binary from './Binary'
import * as $eq from './Eq'
import * as $generatorL from './GeneratorL'
import * as $magma from './Magma'
import * as $matrix from './Matrix'
import * as $mock from './Mock'
import * as $optics from './Optics'
import * as $option from './Option'
import * as $readonlyArray from './ReadonlyArray'
import * as $readonlyRecord from './ReadonlyRecord'
import * as $readonlyTuple from './ReadonlyTuple'
import * as $struct from './struct'
import * as $type from './Type'
import * as $validation from './Validation'

export type PartialDeep<A> = A extends { readonly [x: string]: unknown }
  ? Partial<{ readonly [K in keyof A]: PartialDeep<A[K]> }>
  : A

export type ValuesDeep<A> = A extends { readonly [x: string]: unknown } & {
  readonly [K in keyof A]: unknown
}
  ? A[keyof A] | ValuesDeep<A[keyof A]>
  : A

export type IntersectionDeep<A, B> = A extends { readonly [x: string]: unknown }
  ? A &
      {
        readonly [K in keyof B]: IntersectionDeep<
          K extends keyof A ? A[K] : unknown,
          B[K]
        >
      }
  : B

export {
  $aggregate,
  $binary,
  $eq,
  $generatorL,
  $magma,
  $matrix,
  $mock,
  $optics,
  $option,
  $readonlyArray,
  $readonlyRecord,
  $readonlyTuple,
  $struct,
  $type,
  $validation,
}
