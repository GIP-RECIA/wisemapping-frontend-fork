import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { AppBar, Checkbox, FormControl, FormControlLabel, Tab, TextareaAutosize, Typography } from '@material-ui/core';


import Client, { ErrorInfo } from '../../../../client';
import { activeInstance } from '../../../../redux/clientSlice';
import BaseDialog from '../base-dialog';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { fetchMapById, handleOnMutationSuccess } from '..';
import { useStyles } from './style';

export type PublishProps = {
    mapId: number,
    onClose: () => void
}

const PublishDialog = (props: PublishProps) => {
    const { mapId, onClose } = props;
    const { map } = fetchMapById(mapId);

    const client: Client = useSelector(activeInstance);
    const [model, setModel] = React.useState<boolean>(map ? map.isPublic : false);
    const [error, setError] = React.useState<ErrorInfo>();
    const [activeTab, setActiveTab] = React.useState('1');
    const queryClient = useQueryClient();
    const intl = useIntl();

    const classes = useStyles();
    const mutation = useMutation<void, ErrorInfo, boolean>((model: boolean) => {
        return client.updateMapToPublic(mapId, model);
    },
        {
            onSuccess: () => {
                setModel(model);
                handleOnMutationSuccess(onClose, queryClient);
            },
            onError: (error) => {
                setError(error);
            }
        }
    );

    const handleOnClose = (): void => {
        props.onClose();
        setError(undefined);
    };

    const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        mutation.mutate(model);
    };

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
        event.preventDefault();
        setModel(checked);
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <div>
            <BaseDialog onClose={handleOnClose} onSubmit={handleOnSubmit} error={error}
                title={intl.formatMessage({ id: 'publish.title', defaultMessage: 'Publish' })}
                description={intl.formatMessage({ id: 'publish.description', defaultMessage: 'By publishing the map you make it visible to everyone on the Internet.' })}
                submitButton={intl.formatMessage({ id: 'publish.button', defaultMessage: 'Accept' })}>

                <FormControl fullWidth={true}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={model}
                                onChange={handleOnChange}
                                name="public"
                                color="primary"
                            />
                        }
                        label={intl.formatMessage({ id: 'publish.checkbox', defaultMessage: 'Enable public sharing' })}
                    />
                </FormControl>

                <div style={!model ? { visibility: 'hidden' } : {}}>
                    <TabContext value={activeTab}>
                        <AppBar position="static">
                            <TabList onChange={handleTabChange}>
                                <Tab label={intl.formatMessage({ id: 'publish.embedded', defaultMessage: 'Embedded' })} value="1" />
                                <Tab label={intl.formatMessage({ id: 'publish.public-url', defaultMessage: 'Public URL' })} value="2" />
                            </TabList>
                        </AppBar>
                        <TabPanel value="1">
                            <Typography variant="subtitle2">
                                <FormattedMessage id="publish.embedded-msg" defaultMessage="Copy this snippet of code to embed in your blog or page:" />
                            </Typography>
                            <TextareaAutosize className={classes.textarea} readOnly={true} spellCheck={false} rowsMax={6} defaultValue={`<iframe style="width:600px;height:400px;border:1px solid black" src="https://app.wisemapping.com/c/maps/${mapId}/embed?zoom=1.0"></iframe>`} />
                        </TabPanel>
                        <TabPanel value="2">
                            <Typography variant="subtitle2">
                                <FormattedMessage id="publish.public-url-msg" defaultMessage="Copy and paste the link below to share your map with colleagues:" />
                            </Typography>
                            <TextareaAutosize className={classes.textarea} readOnly={true} spellCheck={false} rowsMax={1} defaultValue={`https://app.wisemapping.com/c/maps/${mapId}/public`} />
                        </TabPanel>
                    </TabContext>
                </div>
            </BaseDialog>
        </div>
    );
}



export default PublishDialog;