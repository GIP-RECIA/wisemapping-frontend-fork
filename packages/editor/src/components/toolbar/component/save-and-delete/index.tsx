import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { $msg } from '@wisemapping/mindplot';
import React from 'react';
import { NodePropertyValueModel } from '../../ToolbarValueModelBuilder';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

const SaveAndDelete = (props: {
  model: NodePropertyValueModel;
  closeModal: () => void;
  submitHandler: () => void;
}) => {
  return (
    <Box component="span">
      <IconButton
        onClick={() => {
          props.closeModal();
          props.model.setValue(undefined);
        }}
      >
        <DeleteOutlineOutlinedIcon />
      </IconButton>
      <Button color="primary" variant="outlined" onClick={props.submitHandler} sx={{ mr: 1 }}>
        {$msg('ACCEPT')}
      </Button>
      <Button color="primary" variant="contained" onClick={props.closeModal}>
        {$msg('CANCEL')}
      </Button>
    </Box>
  );
};

export default SaveAndDelete;