import Joi from 'joi';

export const validateRoomCreation = (data: any) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Room name is required',
        'string.min': 'Room name must be at least 1 character long',
        'string.max': 'Room name must not exceed 100 characters'
      }),
    description: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Room description must not exceed 500 characters'
      }),
    profilePicture: Joi.object({
      type: Joi.string()
        .valid('upload', 'avatar')
        .required(),
      url: Joi.string()
        .uri()
        .optional()
        .when('type', {
          is: 'upload',
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
      avatarStyle: Joi.string()
        .optional(),
      seed: Joi.string()
        .optional()
    }).optional()
  });

  return schema.validate(data);
};

export const validateRoomUpdate = (data: any) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Room name must be at least 1 character long',
        'string.max': 'Room name must not exceed 100 characters'
      }),
    description: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Room description must not exceed 500 characters'
      }),
    profilePicture: Joi.object({
      type: Joi.string()
        .valid('upload', 'avatar')
        .required(),
      url: Joi.string()
        .uri()
        .optional()
        .when('type', {
          is: 'upload',
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
      avatarStyle: Joi.string()
        .optional(),
      seed: Joi.string()
        .optional()
    }).optional()
  });

  return schema.validate(data);
};

export const validateAddMember = (data: any) => {
  const schema = Joi.object({
    username: Joi.string()
      .trim()
      .min(3)
      .max(30)
      .optional() // Can use email instead
      .allow('')
      .messages({
        'string.empty': 'Username is required',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username must not exceed 30 characters'
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Invalid email format'
      })
  }).or('username', 'email') // Require at least one of username or email
  .messages({
    'object.missing': 'Either username or email is required'
  });

  return schema.validate(data);
};

export const validateChangeRole = (data: any) => {
  const schema = Joi.object({
    newRole: Joi.string()
      .valid('admin', 'editor', 'viewer')
      .required()
      .messages({
        'any.only': 'Role must be admin, editor, or viewer',
        'any.required': 'New role is required'
      })
  });

  return schema.validate(data);
};

export const validateRemoveMember = (data: any) => {
  const schema = Joi.object({
    // No additional validation needed for remove member
    // The memberId comes from URL params
  });

  return schema.validate(data);
};
