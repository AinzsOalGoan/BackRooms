import { useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
    const [videos, setVideos] = useState([]);

    const fetchVideos = async () => {
        try {
            const response = await axios.get("/api/v1/video", {
                withCredentials: true,
            });

            setVideos(response.data); // save response in state
            console.log(response.data);
        } catch (error) {
            console.error("Error fetching videos", error);
        }
    };

    return (
        <>
            <h1 className="bg-amber-400 font-black text-3xl rounded justify-center items-center">Hello world</h1>
        </>
    );
}

export default App;
