import { Dialog, DialogContent, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { memo } from "react";

export type Action = 'default' | 'food';

type Props = {
  open: boolean;
  selectedAction: Action;
  onClose: () => void;
  onSelectAction: (action: Action) => void;
};

function TouchAppDialog({ open, selectedAction, onClose, onSelectAction }: Props) {
  function handleChange(_: React.ChangeEvent<HTMLInputElement>, value: string) {
    onSelectAction(value as Action)
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <RadioGroup onChange={handleChange} defaultValue={selectedAction}>
          <FormControlLabel value="default" control={<Radio />} label="Default" />
          <FormControlLabel value="food" control={<Radio />} label="Food" />
        </RadioGroup>
      </DialogContent>
    </Dialog>
  );
}

export default memo(TouchAppDialog);