const { validationResult } = require('express-validator');

// run after a set of express-validator checks - short-circuits with a 400 and a
// consistent error shape so controllers don't each repeat this
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = { validate };
