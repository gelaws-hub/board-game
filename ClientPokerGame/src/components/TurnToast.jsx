import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function TurnToast({ playerUsername, currentUsername = "" }) {
    useEffect(() => {
        console.log("Toast current username : ", currentUsername)
        if (!playerUsername || !currentUsername) return
        if (playerUsername === currentUsername) {
            toast.success("It's your turn!", {
                position: "top-left",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        }
        if (playerUsername !== currentUsername) {
            console.log("Toast player username : ", currentUsername)
            toast.success(`It's ${currentUsername}'s turn!`, {
                position: "top-left",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        }
    }, [currentUsername])

    return (
        <ToastContainer />
    )
}