import React from 'react'
import { apiBaseURL } from '../axiosInstance';
import { useState, useEffect } from 'react';
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import Form from './Form';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';

const Home = () => {

  const [recordData, setRecordData] = useState({
    Subject: '',
    AttendedClasses: '',
    TotalClasses: '',
    Criteria: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [recordList, setRecordList] = useState([]);

  const getRecordList = async () => {
    try {
      const { data } = await apiBaseURL.get("/getrecord");
      setRecordList(data?.records);
      console.log("Fetched records:", data);
    }
    catch (err) {
      console.log("Error fetching records:", err);
    }
  };

  useEffect(() => {
    getRecordList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleUpdate = (data) => {
    setIsUpdating(true);
    setRecordData({
      _id: data._id,
      Subject: data.Subject,
      AttendedClasses: data.AttendedClasses,
      TotalClasses: data.TotalClasses,
      Criteria: data.Criteria
    });
  };

  const handleSubmit = async () => {
    if (!recordData.Subject || !recordData.AttendedClasses || !recordData.TotalClasses || !recordData.Criteria) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (isUpdating) {
        const data = await apiBaseURL.put("/updaterecord", recordData);
        if (data.status) {
          setIsUpdating(false);
          setRecordData({
            Subject: '',
            AttendedClasses: '',
            TotalClasses: '',
            Criteria: ''
          });
        }
      }
      else {
        const data = await apiBaseURL.post("/addrecord", recordData);
        if (data.status) {
          setRecordData({
            Subject: '',
            AttendedClasses: '',
            TotalClasses: '',
            Criteria: ''
          });
        }
        console.log("Record added successfully:", data);
      }
      getRecordList();
    }
    catch (err) {
      console.log("Error adding record:", err);
    }

  }

  const handleDelete = async (id) => {
    try {
      const { data } = await apiBaseURL.post("/deleterecord", {
        Id: id
      })
      if (data?.status === "success") {
        alert(data?.message);
      }
      getRecordList();
    }
    catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className='w-full min-h-[calc(100vh-4rem)]'>
        <Hero recordData={recordData} handleChange={handleChange} handleSubmit={handleSubmit} isUpdating={isUpdating} setIsUpdating={setIsUpdating} setRecordData={setRecordData} />
        <Features />
      </div>
    </>
  )
}

export default Home