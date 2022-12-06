import { Dialog, DialogContent, DialogTitle, Paper } from "@mui/material";
import { memo, useRef } from "react";
import Draggable from "react-draggable";
import type { Ant } from "../createAnt";

type Props = {
  open: boolean;
  selectedAnt?: Ant;
};

function PaperComponent(props: any) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".selectedantdialog-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper style={{ pointerEvents: 'all' }} ref={nodeRef} {...props} />
    </Draggable>
  );
}

function SelectedAntDialog({ open, selectedAnt }: Props) {
  return (
    // keepMounted will retain the <Draggable /> location
    <Dialog open={open} PaperComponent={PaperComponent} keepMounted hideBackdrop style={{ pointerEvents: 'none' }}>
      <DialogTitle style={{ cursor: 'move' }} className="selectedantdialog-dialog-title">{selectedAnt?.name}</DialogTitle>
      <DialogContent>
        Behavior: {selectedAnt?.behavior}
      </DialogContent>
    </Dialog>
  );
}

export default memo(SelectedAntDialog);