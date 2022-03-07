import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => unknown;
  onDeleteSave: () => unknown;
}

function SettingsDialog({ open, onClose, onDeleteSave }: Props){
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Button onClick={onDeleteSave} >Delete Save</Button>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;