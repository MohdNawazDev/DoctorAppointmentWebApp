import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
    
    const [dToken, setDToken] = useState(localStorage.getItem('dToken')?localStorage.getItem('dToken'):'')
    const [appointments, setAppointments] = useState([])
    // to show dashdata in doctor panel 
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)


    const getAppointments = async() => {
        
        try {
            
            
            const {data} = await axios.get(backendUrl + '/api/doctors/appointment', {headers:{dtoken: dToken}})
            console.log('Data in get Appointment: ', data);
            
            
                if(data.success){
                setAppointments(data.appointments)
                    
                // console.log(data.appointments.reverse());
                
            }else{
                toast.error(data.message);
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    };

    // function to mark appointment Completed in doctor panel 
    const completeAppointment = async(appointmentId) => {
        try {
            
            const {data} = await axios.post(backendUrl + '/api/doctors/complete-appointment', {appointmentId}, {headers:{dtoken: dToken}})

            if(data.success){
                toast.success(data.message)
                // update all appointment data 
                getAppointments()
            }else{
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    };


     // function to cancel appointment  in doctor panel 
     const cancelAppointment = async(appointmentId) => {
        try {
            
            const {data} = await axios.post(backendUrl + '/api/doctors/cancel-appointment', {appointmentId}, {headers:{dtoken: dToken}})

            if(data.success){
                toast.warn(data.message)
                // update all appointment data 
                getAppointments()
            }else{
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    };

    // api to show doctorDashboard data 
    const getDashData = async() => {
        try {

            const {data} = await axios.get(backendUrl + '/api/doctors/dashboard', {headers:{dtoken: dToken}})

            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData)
                
            }else{
                toast.error(data.message);
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    };


    // api to fetch the data from api 
    const getProfileData = async(req, res) => {
        try {
            const {data} = await axios.get(backendUrl + '/api/doctors/profile', {headers:{dtoken: dToken}});
            if(data.success){
                setProfileData(data.profileData)
                console.log(data.profileData);
                
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }



   const value = {
        dToken, backendUrl, setDToken, getAppointments,appointments,setAppointments,
        cancelAppointment, completeAppointment, getDashData, dashData,setDashData,
        profileData, setProfileData, getProfileData
    }
    

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )

}

export default DoctorContextProvider
