# nexus-plugin-dynamic-mutation

## Example

**Input**

```js
schema.extendType({
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
        t.field('data', {
          type: 'User',
        })
      },
      resolve(_, args, ctx) {
        return ...
      },
    })
  },
})
```

**Output**

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
  data: User
}
```
