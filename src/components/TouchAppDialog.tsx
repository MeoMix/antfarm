import { Dialog, DialogContent, DialogTitle, FormControlLabel, Paper, Radio, RadioGroup } from "@mui/material";
import { memo, useCallback, useRef } from "react";
import Draggable from "react-draggable";

export type Action = 'default' | 'food';

type Props = {
  open: boolean;
  selectedAction: Action;
  onClose: () => void;
  onSelectAction: (action: Action) => void;
};

function PaperComponent(props: any) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".touchappdialog-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper ref={nodeRef} {...props} />
    </Draggable>
  );
}

function TouchAppDialog({ open, selectedAction, onClose, onSelectAction }: Props) {
  const handleChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, value: string) => {
    onSelectAction(value as Action)
  }, [onSelectAction]);

  return (
    // keepMounted will retain the <Draggable /> location
    <Dialog open={open} onClose={onClose} PaperComponent={PaperComponent} keepMounted hideBackdrop>
      <DialogTitle style={{ cursor: 'move' }} className="touchappdialog-dialog-title">Actions</DialogTitle>
      <DialogContent>
        <RadioGroup onChange={handleChange} defaultValue={selectedAction}>
          <FormControlLabel value="default" control={<Radio />} label="Default" />
        </RadioGroup>
      </DialogContent>
    </Dialog>
  );
}

export default memo(TouchAppDialog);