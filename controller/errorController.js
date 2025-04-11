/* eslint-disable no-else-return */
/* eslint-disable prettier/prettier */
/* eslint-disable no-lonely-if */
/* eslint-disable no-undef */
/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable no-cond-assign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-const-assign */
/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable no-console */
const AppError = require('./../utils/err');

const handelCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handelValidatorErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. [${errors.join(']   [')}]`;
  return new AppError(message, 401);
};
const handleJWTError = () => {
  const message = 'Invalid token. Please log in again!';
  return new AppError(message, 401);
};
const handleJWTExpiredError = () => {
  const message = 'Your token has expired! Please log in again.';
  return new AppError(message, 401);
};
const sendErrorDev = (err, req, res) => {
  //if it was api not render page
  if (req.originalUrl.startsWith('/api')) {
   return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // if render page not api
    console.error('Error',err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  
};
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } 
      console.error('Error',err);
     return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    
  } 
    if(err.isOperational) {
     return res.status(err.statusCode).render('error',{
        title: 'Something went wrong',
        msg: err.message
      });
  }
  
    console.error('Error',err)
    return res.status(err.statusCode).render('error',{
      title: 'Something went wrong',
      msg: 'Please try again later'
    })
};

module.exports = async (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = await { ...err };
    error.name = err.name;
    error.message = err.message;
    if (error.name === 'CastError') {
      error = handelCastErrorDB(error);
    }
    if (err.code === 11000) {
      error.errmsg = err.errmsg;
      error.code = err.code;
    }
    if (err.name === 'ValidationError') {
      error.errors = err.errors;
      console.log(error);
      error = handelValidatorErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, req, res);
  }
};
