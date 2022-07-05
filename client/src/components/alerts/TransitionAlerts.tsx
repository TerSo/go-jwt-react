import { useContext } from "react";
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import Alert from '@mui/material/Alert';
import {AlertContext} from './AlertContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      marginBottom: '32px',
      '& > * + *': {
        marginTop: theme.spacing(2),
      },
    },
    child: {
      display: 'flex',
      justifyContent: 'right'
    }
  }),
);

export const TransitionAlerts = () => {
  const classes = useStyles();
  const [alert, setAlert] = useContext(AlertContext);

  return (
    <div className={classes.root}>
      <Collapse in={alert.visible} className={classes.child}>
        <Alert  onClose={() => {setAlert({message: alert.message, visible: false, type: alert.type})}} 
                severity={alert.type}>
          {alert.message}
        </Alert>
      </Collapse>
    </div>
  );
}