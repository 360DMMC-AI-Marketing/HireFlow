import bycrpt from 'bcryptjs';
 const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
    const salt=bycrpt.genSaltSync(SALT_ROUNDS);
    return bycrpt.hashSync(password,salt);
};  