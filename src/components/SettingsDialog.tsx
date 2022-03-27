import { memo } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, TextField, Grid } from "@mui/material";
import type { Settings } from '../config';

type Props = {
  open: boolean;
  onClose: () => unknown;
  onResetWorld: () => unknown;
  onResetSettings: () => unknown;
  onSettingsChange: (settings: Settings) => unknown;
  settings: Settings;
}

function SettingsDialog({ open, onClose, onResetWorld, onResetSettings, onSettingsChange, settings }: Props){
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12}>
            <Button onClick={onResetWorld}>Reset World</Button>
          </Grid>
          <Grid item xs={12}>
            <Button onClick={onResetSettings}>Reset Settings</Button>
          </Grid>
          <Grid item container xs={12} py={6}>
            <Grid item xs={12} py={2}>
              Requires World Restart
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth
                label="Initial Ant Count"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 1000, step: 1 }}}
                value={settings.initialAntCount}
                onChange={({ target: { value }}) => onSettingsChange({ ...settings, initialAntCount: Math.max(Math.round(Number(value)), 1) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth
                label="Initial Dirt Percent"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 }}}
                value={settings.initialDirtPercent}
                onChange={({ target: { value }}) => onSettingsChange({ ...settings, initialDirtPercent: Math.max(Number(value), 0) })}
              />
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Tick Rate"
              type="number"
              InputProps={{ inputProps: { min: 1 }}}
              value={settings.tickRateMs}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, tickRateMs: Math.max(Math.round(Number(value)), 1) })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Compact Sand Depth"
              type="number"
              InputProps={{ inputProps: { min: 1 }}}
              value={settings.compactSandDepth}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, compactSandDepth: Math.max(Math.round(Number(value)), 1) })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Ant Color"
              type="color"
              value={settings.antColor}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, antColor: value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Probability - Random Dig"
              type="number"
              value={settings.probabilities.randomDig}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 }}}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, probabilities: { ...settings.probabilities, randomDig: Math.max(Number(value), 0) } })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Probability - Random Drop"
              type="number"
              value={settings.probabilities.randomDrop}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 }}}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, probabilities: { ...settings.probabilities, randomDrop: Math.max(Number(value), 0) } })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Probability - Random Turn"
              type="number"
              value={settings.probabilities.randomTurn}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.001 }}}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, probabilities: { ...settings.probabilities, randomTurn: Math.max(Number(value), 0) } })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Probability - Below Surface Dig"
              type="number"
              value={settings.probabilities.belowSurfaceDig}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 }}}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, probabilities: { ...settings.probabilities, belowSurfaceDig: Math.max(Number(value), 0) } })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth
              label="Probability - Above Surface Drop"
              type="number"
              value={settings.probabilities.aboveSurfaceDrop}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 }}}
              onChange={({ target: { value }}) => onSettingsChange({ ...settings, probabilities: { ...settings.probabilities, aboveSurfaceDrop: Math.max(Number(value), 0) } })}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

export default memo(SettingsDialog);