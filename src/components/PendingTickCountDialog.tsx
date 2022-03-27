import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { memo } from "react";

type Props = {
  open: boolean;
  handleCancel: () => unknown;
  pendingTickCount: number;
};

function PendingTickCountDialog({ open, handleCancel, pendingTickCount }: Props) {
  return (
    <Dialog open={open}>
      <DialogTitle>Updating World State</DialogTitle>
      <DialogContent>
        Your ants have been busy while you were away! Your world is {pendingTickCount} ticks behind. 
        Please wait while the world updates, or press cancel to stop updating.
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(PendingTickCountDialog);