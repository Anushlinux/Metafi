import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({

    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\+?[1-9]\d{1,14}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        },
        index: true 
    },

    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required'],
        unique: true,
        trim: true,
        index: true 
    },
});

const User = mongoose.model('User', userSchema);

export default User;
