import mongoose, { Document, Schema } from 'mongoose';

// this is user interface that means user have these characterstics
interface IUser extends Document{
    email : string;
    password : string;
    username : string;
    createdAt : Date;
    updateAt : Date;
}

const UserSchema : Schema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true,
    },

    password : {
        type : String,
        reuqired : true,
    },

    username : {
        type : String,
        unique : true,
        sparse : true,
        trim : true,
    },
},{
    timestamps : true,
});

export default mongoose.model<IUser>('User', UserSchema);