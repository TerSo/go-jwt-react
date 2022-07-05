import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@mui/material/Alert';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      textAlign: 'right',
      '& > * + *': {
        marginTop: theme.spacing(2),
      },
    },
    alert: {
      display: 'inline-flex'
    }
  }),
);

export const TransitionAlert = () => {
  
  const [open, setOpen] = React.useState(false);
  
  return (
    <Alert 
    action={
      <IconButton
        aria-label="close"
        color="inherit"
        size="small"
        onClick={() => {
          setOpen(false);
        }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    }
  >
    Close me!
  </Alert>
  )
 /*
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  return (
    <div className={classes.root}>
      <Collapse in={open} className={classes.alert}>
        <Alert 
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setOpen(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          Close me!
        </Alert>
      </Collapse>
      <Button
        disabled={open}
        variant="outlined"
        onClick={() => {
          setOpen(true);
        }}
      >
        Re-open
      </Button>
    </div>
  );
  */
}

