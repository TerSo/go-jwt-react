import { useState, useEffect } from "react";
import { Grid, Button, FormControlLabel, Checkbox } from '@material-ui/core';
import { Face, Fingerprint } from '@material-ui/icons'

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import LinearProgress from '@mui/material/LinearProgress';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';

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

export const ForgotPassword = () => {
    const classes = useStyles();

    const [loginValues, setLoginValues] = useState({email: ''});
    const [isLoading, setLoading] = useState(false);
    const [completed, setcompleted] = useState(false);

    const handleSubmit = (e:any) => {
        setLoading(true)
        console.log(loginValues)
        console.log(isLoading)
        e.preventDefault();
    }

    const handleChange = (event:any) => {
        setLoginValues({...loginValues, [event.target.name]: event.target.value})
    }
  
    return (
            <Card className={classes.root}>
                {isLoading ? ( <LinearProgress />) : ''}
                <CardContent className={classes.cardContent}> {
                    completed ? (
                        <Grid container spacing={4} alignItems="flex-end">
                            <Grid item>
                                <p>Done!! Check your email to change the password</p>
                            </Grid>
                        </Grid>
                    ) : (
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
                            <Grid container justifyContent="center" style={{ marginTop: '10px' }}>
                                <Button variant="outlined" 
                                        color="primary" 
                                        type="submit" 
                                        disabled={isLoading}
                                        style={{ textTransform: "none" }}>
                                    Send
                                </Button>
                            </Grid>
                        </form>
                    )
                }</CardContent>
            </Card>
       
    );
}