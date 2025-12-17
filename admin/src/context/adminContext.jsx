import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'
export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken')?localStorage.getItem('aToken'):'');
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)

    const backEndUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
    // console.log("Backendurl", backEndUrl);

    const getAllDoctors = async(req, res) => {
         
            try {
                const {data} = await axios.post(backEndUrl + '/api/admin/all-doctors', {}, {headers: {atoken: aToken}});

            if(data.success){
                setDoctors(data.doctors);
                console.log(data.doctors);
                
            }else{
                toast.error(data.message);

            }

        } catch (error) {
            toast.error(error.message)        
            }
       
    }

    // changing availability of doctor using api 
    const changeAvailability = async(docId) => {
        try {
            const { data } = await axios.post(backEndUrl + '/api/admin/change-availability',{docId}, {headers:{aToken}})
            if(data.success){
                toast.success("Availability Changed")
                getAllDoctors(); //updating get all doctors 
            }else{
                toast.error(data.message)
            }
                        

            
        } catch (error) {
            console.log(error);
            toast.error("Error Occured Changing Availability")
            
        }
    }

    // api to get all appointments 

    const getAllAppointments = async(req, res) => {
        try {

            const {data} = await axios.get(backEndUrl + '/api/admin/appointments', {headers:{aToken}})
            
            if(data.success){
                setAppointments(data.appointments)
            }else{
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    };

// api to cancel appointment 
const cancelAppointment = async(appointmentId) => {
    try {
        const {data} = await axios.post(backEndUrl + '/api/admin/cancel-appointment', {appointmentId}, {headers:{aToken}})
            
        if(data.success){
            toast.success(data.message)
            getAllAppointments()

        }else{
            toast.error(data.message)
        }
        
    } catch (error) {
        toast.error(error.message)
    }
};

    // api to get dashboard data 
    const getDashData = async() => {
        try {
            
            const {data} = await axios.get(backEndUrl + '/api/admin/dashboard', {headers:{atoken: aToken}})
            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData);
                
            }else{
                toast.error(data.message)
            }


        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    }


  

   const value = {
        aToken, setAToken,
        backEndUrl, 
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments, setAppointments,
        getAllAppointments,
        cancelAppointment,
        dashData, getDashData
    }


    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider
