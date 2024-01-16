
module.exports = {
  extends: 'eslint:recommended',

  rules: {
    'no-extra-parens': 2,
    'no-unexpected-multiline': 2,
    // All JSDoc comments must be valid
    'valid-jsdoc': [true, {
      requireReturn: false,
      requireReturnDescription: false,
      requireParamDescription: true,
      prefer: {
        return: 'returns'
      }
    }],
  }
};
