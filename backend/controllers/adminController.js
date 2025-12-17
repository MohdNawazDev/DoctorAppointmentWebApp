import validator from 'validator'
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from 'cloudinary' 
import doctorModel from "../models/doctorModel.js"
import connectCloudinary from '../config/cloudinary.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'

// // api for adding doctor
const addDoctor = async (req, res) => {

    try{
        const {name, email, password, speciality, degree, experience, about, fee, address} = req.body
        // we will pass data in the form of form so we need a middleware
        

        // const imageFile = req.file;
        // console.log("value of imageFile is: ", imageFile);


    
    
        const imageFile = req.file; // used file instead of files because one image is send at a time.

        

        //checking for all data to add doctor 
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fee || !address){
            return res.json({success:false, message: "Missing details"})
        }


        // validating email 
        if(!validator.isEmail(email)){
            return res.json({success:false, message: "Please enter valid email"})
        }

        //validating string password 
        if(password.length < 8){
            return res.json({success:false, message: "Please enter a strong password"})
        }


//         // hashing doctor password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)


//         //--------------------this is not working -----------------
//         // // // upload img to cloudinary   
//         // await connectCloudinary()
       
//         // const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
//         // const imageUrl = imageUpload.secure_url;

        
//         // upload img to cloudinary   
        // ----------so Using default image-------------------------
      
        let imageUrl; // Declare the imageUrl variable


        if (imageFile) {
            // Upload img to Cloudinary only if an image file is present
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        } else {
            // Use a default image URL if no image is provided
            imageUrl = "https://example.com/path/to/default-image.png"; // Replace with your actual default image URL
        }


        if (imageFile) {
            // Upload img to Cloudinary only if an image file is present
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"});
          
            
            imageUrl = imageUpload.secure_url;
            // console.log(imageUrl)
        } 
        else {
            // Use a default image URL if no image is provided -- this is executing always
            // imageUrl = "https://example.com/path/to/default-image.png"; // Replace with your actual default image URL
            imageUrl = "https://img.freepik.com/premium-photo/indian-female-doctor-indian-nurse_714173-201.jpg"
        }

        
        const doctorData = {
            name,
            email,
            image:imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fee,
            address:JSON.parse(address), //it will store the address in obj form
            date:Date.now()
        }


        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({success:true, message: "Doctor Added"})

        
    }catch(error){
        console.log(error);
        res.json({success: false, message:error.message})
        
    }
}



// // API FOR ADMIN LOGIN
const loginAdmin = async(req, res) => {
    try {
        // first we will get the email id and pass from req and we wil match that email and password with this env variables
        //it that matching we will create a token using jsonWebToken
        const {email, password} = req.body;

        // Trim whitespace from environment variables to handle any formatting issues
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();

        console.log('Login attempt:', { email, passwordProvided: !!password });
        console.log('Env vars set:', { adminEmail: !!adminEmail, adminPassword: !!adminPassword });

        if(email === adminEmail && password === adminPassword){
            const token = jwt.sign({email:email, role: 'admin'}, process.env.JWT_SECRET)
            res.json({success: true, token})

        }else{
            //if not matching
            console.log('Credentials do not match');
            console.log('Expected email:', adminEmail, 'Got:', email);
            console.log('Password match:', password === adminPassword);
            res.json({success: false, message: "Invalid Credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({success: false, message:error.message})

    }
}


// api to fetch all doctors data for all admin panel 
const allDoctors = async(req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success: true, doctors})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error occured"})
        
    }


}


// api to get all appointments 
const appointmentAdmin = async(req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({success:true, appointments})
        

    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
        
    }
}

// api for cancellation of appointment 
const appointmentCancel = async(req, res) => {

    try {
        const { appointmentId} = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

         // Now if the user is authorized User
        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true});
        
        // releasing doctor data that user had booked earlier 
        const {docId, slotDate, slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);

        let slots_booked =  doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime) //yaha galti ki thi bro slot_booked tha

        await doctorModel.findByIdAndUpdate(docId, {slots_booked});
        res.json({success:true, message:'Appointment Cancelled'})

    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
};


// api to get dashboard data for admin panel 
const adminDashboard = async(req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const user = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: user.length,
            latestAppointment: appointments.reverse().slice(0,3)

        }
        res.json({
            success: true,
            dashData
        })
        
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
}

export {addDoctor, loginAdmin, allDoctors, appointmentAdmin, appointmentCancel, adminDashboard}



