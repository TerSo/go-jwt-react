
import { useState, useEffect, useContext } from "react";
import { Grid, Button, FormControlLabel, Checkbox } from '@material-ui/core';
import { Face, Fingerprint } from '@material-ui/icons'

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import LinearProgress from '@mui/material/LinearProgress';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';
import SetJWToken from './SetJWToken'
import ApiService from '../../services/ApiService'
import {AlertContext} from '../alerts/AlertContext';

const Api = new ApiService()
const bc = new BroadcastChannel('auth-notification')

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            maxWidth: 690,
            [theme.breakpoints.down("md")] : {
                width: '100%'
            },
            margin: 'auto'
        },
        cardContent: {
            padding: '56px'
        },
        remember: {
            padding: '26px 0 12px 0'
        }
    })
);

export const LoginForm = () => {
    const classes = useStyles();
    const [alert, setAlert] = useContext(AlertContext)

    const [loginValues, setLoginValues] = useState({email: '', password: ''})
    const [isLoading, setLoading] = useState(false)

    const handleSubmit = (e:any) => {
        e.preventDefault();

        setLoading(true)

        Api.login(loginValues)
        .then((response) => {
            if(response.status === 200) {
                SetJWToken(response.data)
                bc.postMessage('login')
                window.location.href="/"
            } else {
                setAlert({visible: true, message: response.statusText, type: 'error'})
            }
            setLoading(false)
        })
    }

    const handleChange = (event:any) => {
        // if(loginValues.email && event.target.checked)  localStorage.setItem('email', loginValues.email)
        setLoginValues({...loginValues, [event.target.name]: event.target.value})
    }
  
    return (
            <Card className={classes.root}>
             {isLoading ? ( <LinearProgress />) : ''}
            <CardContent className={classes.cardContent}>
           
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={4} alignItems="flex-end">
                        <Grid item>
                            <Face />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField  label="Username"
                                        name="email"
                                        type="email" 
                                        fullWidth 
                                        autoFocus  
                                        disabled={isLoading}
                                        onChange={handleChange}
                                        required />
                        </Grid>
                    </Grid>
                    <Grid container spacing={4} alignItems="flex-end">
                        <Grid item>
                            <Fingerprint />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField  label="Password" 
                                        name="password"
                                        type="password"
                                        disabled={isLoading}
                                        onChange={handleChange} 
                                        fullWidth 
                                        required />
                        </Grid>
                    </Grid>
                    <Grid container alignItems="center" justifyContent="space-between" className={classes.remember}>
                        <Grid item>
                            <FormControlLabel control={
                                <Checkbox color="primary" onChange={handleChange} disabled={isLoading} />
                            } label="Remember me" />
                        </Grid>
                        <Grid item>
                            <Button disableFocusRipple 
                                    disableRipple 
                                    component={Link} to="/signin"
                                    style={{ textTransform: "none" }} 
                                    variant="text" 
                                    color="primary">
                                Sign in
                            </Button>
                            <span>|</span>
                            <Button disableFocusRipple 
                                    disableRipple 
                                    component={Link} to="/forgot-password"
                                    style={{ textTransform: "none" }} 
                                    variant="text" 
                                    color="primary">
                                Forgot password ?
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="center" style={{ marginTop: '10px' }}>
                        <Button variant="outlined" 
                                color="primary" 
                                type="submit" 
                                disabled={isLoading}
                                style={{ textTransform: "none" }}>
                            Login
                        </Button>
                    </Grid>
                    </form>
            </CardContent>
            </Card>
       
    );
}