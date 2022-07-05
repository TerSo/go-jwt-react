import {Info} from "./components/staticPages/Info"
import {Home} from "./components/staticPages/Home"
import {PageNotFound} from "./components/staticPages/PageNotFound"
import HomeIcon from '@material-ui/icons/Home';
import HelpIcon from '@material-ui/icons/Help';
import { Route, Routes, Navigate } from "react-router-dom";
import {LoginForm} from './components/authentication/LoginForm';
import {SignInForm} from './components/authentication/SignInForm';
import {ForgotPassword} from './components/authentication/ForgotPassword';
import {UserProfile} from './components/users/UserProfile'
import UsersCollection from './components/users/UsersCollection'
import ApiService from './services/ApiService'

interface RoutesList {
    path:       string,
    text:       string,
    icon:       any,
    element:    any
}

const MenuItems: Array<RoutesList> = [
    {
        path: "",
        text: "Home",
        icon: <HomeIcon />,
        element: <Home />
    },
    {
        path: "info",
        text: "Info",
        icon: <HelpIcon />,
        element: <Info />
    }
];

const AppRoutes = () => {
    return (
        <Routes>   
            <Route  path="*" element={<PageNotFound />} />
            <Route  path="" element={<Home />} />
            <Route  path="info" element={<Info />} />
            <Route  path="login" element={ ApiService.IsLoggedIn() ? <Navigate to="/" /> : <LoginForm /> }/>
            <Route  path="signin" element={ ApiService.IsLoggedIn() ? <Navigate to="/" /> : <SignInForm /> }/>
            <Route  path="forgot-password" element={ ApiService.IsLoggedIn() ? <Navigate to="/" /> : <ForgotPassword /> }/>
            <Route  path="profile" element={<UserProfile />} />
            <Route  path="users" element={<UsersCollection />} />
            <Route  path="users/:id" element={<UserProfile />} />
        </Routes>
    )
}

export {MenuItems, AppRoutes}