import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'//yaha mistake kari thi
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'



// api to register user 
const registerUser = async(req, res) => {
    try {
        
        const {name, email, password} = req.body;

        if(!name || !password || !email){
            res.json({success: false, message:"Missing Details"})
        }

        // validating emai

        if(!validator.isEmail(email)){
            return  res.json({success: false, message:"enter a valid email"})
        }

        // valdating strong password
        if(password.length < 8){
            return  res.json({success: false, message:"enter a minimum 8 length password"})
        }


        // hasing use password 

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name, 
            email,
            password:hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save();

        // creating atoken 
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
        res.json({success: true, token})


    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}



// api for user login 
const userLogin = async(req, res) => {
    try {
        const {email, password} = req.body;
        const user = await userModel.findOne({email})

        if(!user){
            //it will terminate the request after sending the response 
           return res.json ({success: false, message:'User does not exist'})
        }
        // if user not exist say for registeration 
        const isMatch = await bcrypt.compare(password, user.password)
        
        if(isMatch){
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)
            res.json({success: true, token})
            
        }else{
            res.json({success: false, message: 'Invalid credentials'})
        }


    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}


// creating a api to get userProfle data 
const getProfile = async(req, res) => {
    try {
 // we will not get userId using this user should sent the token by using that token we will get id
    
    const {userId} = req.body;
    const  userData  = await userModel.findById(userId).select('-password');
    res.json({success:true, userData})
    

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }


}

// api to update to user profile 

const updateProfile = async(req, res) =>{
try {
    const {userId, name, phone, address, dob, gender} = req.body;
    const imageFile = req.file;

    // console.log(req.body)

    if (!name || !phone  || !dob ||  !gender) {
        return res.json({success: false, message:"Data missing"})
    }
   

    await userModel.findByIdAndUpdate(userId, {name, phone,
         address:JSON.parse(address), dob, gender})

    if(imageFile){

        // upload image to cloudinary 
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, 
            {resource_type: 'image'})
        const imageUrl = imageUpload.secure_url; 

        await userModel.findByIdAndUpdate(userId, {image: imageUrl})
        
    }
    res.json({success: true, message:'Profile Updated'})


    

 } catch (error) {
    console.log(error);
    res.json({success: false, message:error.message})
    
}
}



// api to book appoinment 
// const bookAppointment = async(req, res) => {

//     try {
//         const {userId, docId, slotDate, slotTime} = req.body;

//         const docData = await doctorModel.findById(docId).select('-password')
//         console.log('docid is',docData);
       

//         if(!docData.available){
//             console.log('checking availability.');
//             res.json({success: false, message:"Doctor Not available"})
//         }

//         let slots_booked = docData.slots_booked

//         // checking slots availability
//         if(slots_booked[slotDate]){
//            if( slots_booked[slotDate].includes(slotTime)){
//             // return nhi likha tha
//             return res.json({success: false, message:"Slots Not available"})
//            }else{
//                 slots_booked[slotDate].push(slotTime)
//            }

//         }else{
//             // if we no one booked slot on that date
//             slots_booked[slotDate] = []
//             slots_booked[slotDate].push(slotTime);
//         }


//         const userData = await userModel.findById(userId).select('-password');

//         delete docData.slots_booked 

//         const appointmentData = {
//             userId,
//             docId,
//             userData,
//             docData,
//             amount: docData.fee,
//             slotTime,
//             slotDate,
//             date:Date.now()
//         }

//         const newAppointment = new appointmentModel(appointmentData)
//         await newAppointment.save();

    
//         // save new slot data in doctor data 
//         await doctorModel.findByIdAndUpdate(docId, {slots_booked})
//         return res.json({success:true, message:'Appointment Booked'})
        
//     } catch (error) {
//         console.log(error);
//         res.json({success: false, message:error.message})
//     }

// } 
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

        const docData = await doctorModel.findById(docId).select('-password');
        if (!docData) {
            console.error(`Doctor not found for docId: ${docId}`);
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Check if doctor is available
        if (!docData.available) {
            return res.json({ success: false, message: "Doctor not available" });
        }

        let slots_booked = docData.slots_booked || {};

        // Check and update slots based on slotDate and slotTime
        if (slots_booked[slotDate]?.includes(slotTime)) {
            return res.json({ success: false, message: "Slot not available" });
        } else {
            slots_booked[slotDate] = slots_booked[slotDate] || [];
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        delete docData.slots_booked;

        // Prepare and save appointment data
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fee,
            slotTime,
            slotDate,
            date: Date.now(),
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor with new slot
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        return res.json({ success: true, message: 'Appointment booked' });

    } catch (error) {
        console.error('Error in bookAppointment:', error.message);
        return res.json({ success: false, message: error.message });
    }
};


// const bookAppointment = async (req, res) => {
//     try {
//         const { userId, docId, slotDate, slotTime } = req.body;

//         // Attempt to find the doctor by docId
//         const docData = await doctorModel.findById(docId).select('-password');
//         console.log('docid is', docId);
//         console.log('Value of docData is: ', docData);

//         if (!docData) {
//             console.error(`Doctor not found for docId: ${docId}`);
//             return res.json({ success: false, message: "Doctor Not found" });
//         }

//         // Check if the doctor is available
//         if (!docData.available) {
//             console.log('Doctor is unavailable.');
//             return res.json({ success: false, message: "Doctor Not available" });
//         }

//         // Initialize slots_booked array if not present
//         let slots_booked = docData.slots_booked || {};

//         // Check and update slots based on slotDate and slotTime
//         if (slots_booked[slotDate]?.includes(slotTime)) {
//             return res.json({ success: false, message: "Slot Not available" });
//         } else {
//             slots_booked[slotDate] = slots_booked[slotDate] || [];
//             slots_booked[slotDate].push(slotTime);
//         }

//         const userData = await userModel.findById(userId).select('-password');
//         delete docData.slots_booked; // Remove this field for appointment creation

//         // Prepare appointment data
//         const appointmentData = {
//             userId,
//             docId,
//             userData,
//             docData,
//             amount: docData.fee,
//             slotTime,
//             slotDate,
//             date: Date.now()
//         };

//         // Save new appointment
//         const newAppointment = new appointmentModel(appointmentData);
//         await newAppointment.save();

//         // Update doctor with new slot
//         await doctorModel.findByIdAndUpdate(docId, { slots_booked });
//         res.json({ success: true, message: 'Appointment Booked' });
        
//     } catch (error) {
//         console.error('Error in bookAppointment:', error.message);
//         res.json({ success: false, message: error.message });
//     }
// };



// api to get user appointment for frontEnd - my appointment page 
const listAppointment = async(req, res) => {
    try {
        const {userId} = req.body;
        const appointments = await appointmentModel.find({userId})
        res.json({success: true, appointments})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
        
    }
}

// api to cancel userAppointment 
const cancelAppointment = async(req, res) => {

    try {
        const {userId, appointmentId} = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        // verifying appointment user 
        if(appointmentData.userId !== userId){
           return res.json({success:false, message: 'Unauthorized User'})
        }

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

// api to make payment of appointment using razorpay 

const paymentRazorPay = async(req, res) => {
    const razorpayInstance = new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    try {
        const {appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        // if there is no appointment or the appointment is cancelled 
        if(!appointmentData || appointmentData.cancelled){
            res.json({
                success: false,
                message: "Appointment cancelled or data not found "
            })
        }

        // Now creating optins for razorpay 
        const options = {
            amount: appointmentData.amount * 100,
            currency: appointmentData.CURRENCY,
            receipt: appointmentId,
        }
        
        // creation of an order 
        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true, order})

    } catch (error) {
        console.log(error);
        res.json({success:false, message:'User Not found'})
        
    }
}

// api to verify razorpay payment 
const verifyPayment = async(req, res) => {
    const razorpayInstance = new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    try {
        const {razorpay_order_id} = req.body 
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        
        if(orderInfo.status === 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {payment: true})
            res.json({success: true, message: 'Payment Successful'})
        }else{
            res.json({success:false, message: 'Payment failed'})
        }
        
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
        
    }
}

export  {registerUser, userLogin, getProfile, updateProfile, bookAppointment, listAppointment,
cancelAppointment, paymentRazorPay, verifyPayment}

