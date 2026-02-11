const hashBeforeSaving = (schema) => {
    schema.pre('save', async function (next) {
        if (this.isModified('password')) {
            try {
                const hashedPassword = await hashPassword(this.password);
                this.password = hashedPassword;
                next();
            } catch (err) {
                next(err);
            }       
        } else {
            next();
        }  
    });
} ;
export default hashBeforeSaving;