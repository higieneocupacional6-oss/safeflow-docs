import argon2 from "argon2";

const MIN_LENGTH = 8;

export const validatePasswordPolicy = (password: string) => {
  if (password.length < MIN_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_LENGTH} caracteres.`;
  }
  return null;
};

export const hashPassword = (password: string) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

export const verifyPassword = async (hash: string, password: string) => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};
