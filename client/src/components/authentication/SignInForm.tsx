
import { useState, useContext, useCallback } from "react";
import { Grid, Button, FormControlLabel, Checkbox } from '@material-ui/core';
import { Face, Fingerprint } from '@material-ui/icons'
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';

import ApiService from '../../services/ApiService'
import SetJWToken from './SetJWToken'
import {AlertContext} from '../alerts/AlertContext';

const Api = new ApiService()

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

export const SignInForm = () => {
    
    const classes = useStyles();
    const [alert, setAlert] = useContext(AlertContext);

    const [isLoading, setLoading] = useState(false);

    const [token, setToken] = useState(null);

    const [signInValues, setSignInValues] = useState({
        name: '',
        surname: '',
        email: '', 
        password: '',
        'confirm-password': ''
    });

    const HandleResponse = useCallback(
        response => {
            setAlert({visible: true, message: 'Welcome!', type: 'success'})
            SetJWToken(response.data)
            window.location.href="/profile"
        },
        [alert]
    );

    const HandleError = useCallback(
        error => {
            setAlert({visible: true, message: error, type: 'error'})
        },
        [alert]
    );

    const handleSubmit = (e:any) => {
        e.preventDefault();
        if(!comparePassWords()) return

        setLoading(true)
        Api.signIn(signInValues)
        .then((response) => {
            if(response.status === 204) {
                HandleError(response.statusText)
            } else {
                HandleResponse(response)
            }  
        })
        .catch((error) => {
            HandleError(error.statusText)
        })
        .finally( () => {
            setLoading(false)
        })
        
    }

    const comparePassWords = () => {
        if(signInValues.password === signInValues["confirm-password"]) {
            return true
        }
        setAlert({visible: true, message: "Passwords are not the same", type: 'warning'})
        return false
    }

    const handleChange = (event:any) => {
        console.log(event.target.value)
        setSignInValues({...signInValues, [event.target.name]: event.target.value})
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
                            <TextField  label="Firstname"
                                        name="name"
                                        type="text" 
                                        autoFocus
                                        fullWidth  
                                        disabled={isLoading}
                                        onChange={handleChange}
                                        required />
                        </Grid>
                    </Grid>
                    <Grid container spacing={4} alignItems="flex-end">
                        <Grid item>
                            <Face />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField  label="Lastname"
                                        name="surname"
                                        type="text" 
                                        fullWidth
                                        disabled={isLoading}
                                        onChange={handleChange}
                                        required />
                        </Grid>
                    </Grid>
                    <Grid container spacing={4} alignItems="flex-end">
                        <Grid item>
                            <Face />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField  label="Email"
                                        name="email"
                                        type="email" 
                                        fullWidth 
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
                    <Grid container spacing={4} alignItems="flex-end">
                        <Grid item>
                            <Fingerprint />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField  label="Confirm password" 
                                        name="confirm-password"
                                        type="password"
                                        disabled={isLoading}
                                        onChange={handleChange} 
                                        fullWidth
                                        required />
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="center" style={{ marginTop: '10px' }}>
                        <Button variant="outlined" 
                                color="primary" 
                                type="submit" 
                                disabled={isLoading}
                                style={{ textTransform: "none" }}>
                            Sign in 
                        </Button>
                    </Grid>
                   
                    </form>
            </CardContent>
            </Card>
       
    );
}