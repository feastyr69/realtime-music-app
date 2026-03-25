import React from "react";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Jam from "./components/Jam";
import Create from "./components/Create";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/jam/:roomId" element={<Jam />} />
      <Route path="/create" element={<Create />} />
    </Routes>
  );
}


