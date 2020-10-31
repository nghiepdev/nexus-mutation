# nexus-plugin-dynamic-mutation

[![NPM version](https://img.shields.io/npm/v/nexus-plugin-dynamic-mutation.svg)](https://www.npmjs.com/package/nexus-plugin-dynamic-mutation)
[![NPM yearly download](https://img.shields.io/npm/dy/nexus-plugin-dynamic-mutation.svg)](https://www.npmjs.com/package/nexus-plugin-dynamic-mutation)

> Nexus plugin to ease create dynamic mutation.

## Installation

```bash
yarn add nexus-plugin-dynamic-mutation
```

## Usage

### Input

```js
import {extendType} from '@nexus/schema';

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.dynamicMutation('createUser', {
      name: 'CreateUser',
      description: 'Create new a user',
      nonNullDefaults: {
        input: true,
        output: false,
      },
      input(t) {
        t.string('fullname')
        t.string('email')
      },
      payload(t) {
        t.string('message')
        t.field('user', {
          type: 'User',
        })
      },
      async resolve(_, args, ctx) {
        const user = await fetch(...);
        return {
          message: "Success!",
          user
        }
      },
    })
  },
})
```

### Output

```graphql
type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
}

input CreateUserInput {
  fullname: String!
  email: String!
}

type CreateUserPayload {
  message: String
  user: User
}
```

## License

MIT © [Nghiep](mailto:me@nghiepit.dev)
