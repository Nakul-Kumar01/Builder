import About from "./components/About";
import App from "./components/app";
import Footer from "./components/footer";
import Me from "./components/aboutme";
import HeaderProfile from "./components/headerProfile";


export default function ActualBuilder() {

    return (
        <>
            <HeaderProfile></HeaderProfile>
            <App></App>
            <About></About>
            <Me></Me>
            <Footer></Footer>
        </>
    )
}