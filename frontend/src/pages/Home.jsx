import React from "react";
import { useSelector } from "react-redux";

const Home = () => {
    const user = useSelector(state => state.auth.userData)

    return (
        <div>
        <h1>This is home page</h1>
        </div>
    );
};

export default Home;
