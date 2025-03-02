import mongoose from 'mongoose';

const connectDB = async() => {
    try {

        await mongoose.connect("mongodb+srv://dhaivatjambudia:3NlrL3IoQmDGfBgv@cluster0.2bejr.mongodb.net/DishDash", {
            useNewUrlParser : true,
            useUnifiedTopology : true
        } as any);

        console.log("MongoDB Connected");

    }catch(error){

        console.log("MongoDB connection error:", error);
        process.exit(1);

    }
};

export default connectDB;