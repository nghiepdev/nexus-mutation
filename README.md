# nexus-mutation

[![NPM version](https://img.shields.io/npm/v/nexus-mutation.svg)](https://www.npmjs.com/package/nexus-mutation)
[![NPM monthly download](https://img.shields.io/npm/dm/nexus-mutation.svg)](https://www.npmjs.com/package/nexus-mutation)

> A plugin for Nexus to automatically create object type

## Installation

```bash
yarn add nexus-mutation
```

## Usage

### Basic

#### Input

```js
import {extendType} from 'nexus';

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.dynamicMutation('login', {
      name: 'Login',
      description: 'Handleing Login mutation',
      nonNullDefaults: {
        input: true,
        output: false,
      },
      input(t) {
        t.string('username');
        t.string('password');
      },
      payload(t) {
        t.string('message');
        t.field('user', {
          type: 'User',
        });
      },
      async resolve(_, args, ctx) {
        const {input} = args;
        const user = await fetch('/api/login', {
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

#### Output

```gql
type Mutation {
  login(input: LoginInput!): LoginPayload!
}

input LoginInput {
  username: String!
  password: String!
}

type LoginPayload {
  message: String
  user: User
}
```

### Advanced (with Unions)

Handling GraphQL errors like a champ with interfaces and unions

> Plugin will select the first member object type to fallback resolveType

#### Input

```js
import {extendType, interfaceType, objectType} from 'nexus';

export const ErrorInterface = interfaceType({
  name: 'Error',
  definition(t) {
    t.string('message');
  },
  resolveType() {
    return null;
  },
});

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.dynamicMutation('register', {
      name: 'Register',
      input(t) {
        t.string('username');
        t.string('password');
        t.string('fullname');
      },
      payload: {
        result: 'User', // First type to fallback resolveType
        validationError(t) {
          t.implements('Error');
          t.nullable.string('username');
          t.nullable.string('password');
        },
        countryBlockedError(t) {
          t.implements('Error');
          t.nullable.string('description');
        },
      },
      async resolve(_, args, ctx) {
        const {input} = args;

        if (false === validate(input)) {
          return {
            message: 'Validation input failed',
            username: 'Username has already been taken',
            __typename: 'RegisterValidationError', // Required
          };
        }

        if (false === checkRegion(ctx)) {
          return {
            message: 'Blocked',
            description: 'Registration not available in your region',
            __typename: 'RegisterCountryBlockedError', // Required
          };
        }

        const user = await fetch('/api/user', {
          method: 'POST',
          body: JSON.stringify(input),
        });

        // Fallback
        return user;
      },
    });
  },
});
```

#### Output

```gql
type Mutation {
  register(input: RegisterInput!): RegisterPayload!
}

input RegisterInput {
  fullname: String
  password: String
  username: String
}

type RegisterCountryBlockedError implements Error {
  description: String
  message: String!
}

type RegisterValidationError implements Error {
  message: String!
  password: String
  username: String
}

union RegisterPayload =
    RegisterCountryBlockedError
  | RegisterValidationError
  | User
```

#### Result

```gql
mutation Register {
  register(
    input: {username: "johndoe", password: "123456", fullname: "John Doe"}
  ) {
    ... on Error {
      message
    }
    ... on RegisterValidationError {
      username
      password
    }
    ... on RegisterCountryBlockedError {
      description
    }
    ... on User {
      id
      username
      fullname
    }
  }
}
```

## License

MIT
