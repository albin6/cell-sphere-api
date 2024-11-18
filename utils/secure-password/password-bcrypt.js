import bcrypt from "bcrypt";

export const hash_password = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.log(error);
  }
};

export const compare_password = async (password, db_password) => {
  try {
    return await bcrypt.compare(password, db_password);
  } catch (error) {
    console.log(error);
  }
};
