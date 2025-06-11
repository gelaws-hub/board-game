import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function TurnToast({ playerUsername, currentUsername = "" }) {
    useEffect(() => {
        if (!playerUsername || !currentUsername) return
        if (playerUsername === currentUsername) {
            toast.success("It's your turn!", {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        }
        if (playerUsername !== currentUsername) {
            toast.success(`It's ${playerUsername}'s turn!`, {
                position: "top-right",
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