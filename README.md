# nexus-plugin-dynamic-mutation

[![NPM version](https://img.shields.io/npm/v/nexus-plugin-dynamic-mutation.svg)](https://www.npmjs.com/package/nexus-plugin-dynamic-mutation)
[![NPM monthly download](https://img.shields.io/npm/dm/nexus-plugin-dynamic-mutation.svg)](https://www.npmjs.com/package/nexus-plugin-dynamic-mutation)

> A plugin for Nexus to automatically create object type

## Installation

```bash
yarn add nexus-plugin-dynamic-mutation
```

## Usage

### Input

```js
import {extendType} from 'nexus';

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.dynamicMutation('createUser', {
      name: 'CreateUser',
      description: 'Create new a User',
      nonNullDefaults: {
        input: true,
        output: false,
      },
      input(t) {
        t.string('fullname');
        t.string('email');
      },
      payload(t) {
        t.string('message');
        t.field('user', {
          type: 'User',
        });
      },
      async resolve(_, args, ctx) {
        const {input} = args;
        const user = await fetch('/create-user', {
          method: 'POST',
          body: JSON.stringify(input),
        });

        return {
          message: 'Success!',
          user,
        };
      },
    });
  },
});
```

### Output

```gql
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
