import React, { useEffect } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import Client, { BasicMapInfo, ErrorInfo } from "../../../../client";
import { activeInstance } from '../../../../redux/clientSlice';
import { DialogProps, fetchMapById, handleOnMutationSuccess } from "..";
import Input from "../../../form/input";
import { FormControl } from "@material-ui/core";
import BaseDialog from "../base-dialog";

export type RenameModel = {
    id: number;
    title: string;
    description?: string;
}

const defaultModel: RenameModel = { title: '', description: '', id: -1 };
const RenameDialog = (props: DialogProps) => {
    const service: Client = useSelector(activeInstance);
    const [model, setModel] = React.useState<RenameModel>(defaultModel);
    const [error, setError] = React.useState<ErrorInfo>();
    const { mapId, open } = props;

    const intl = useIntl();
    const queryClient = useQueryClient();

    const mutation = useMutation<RenameModel, ErrorInfo, RenameModel>((model: RenameModel) => {
        const { id, ...rest } = model;
        return service.renameMap(id, rest).then(() => model);
    },
        {
            onSuccess: () => {
                handleOnMutationSuccess(props.onClose, queryClient);
            },
            onError: (error) => {
                setError(error);
            }
        }
    );

    const handleOnClose = (): void => {
        props.onClose();
        setModel(defaultModel);
        setError(undefined);
    };

    const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        mutation.mutate(model);
    };

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        event.preventDefault();

        const name = event.target.name;
        const value = event.target.value;
        setModel({ ...model, [name as keyof BasicMapInfo]: value });
    }

    const { map } = fetchMapById(mapId);
    useEffect(() => {
        if (open && map) {
            setModel(map);
        } else {
            setModel(defaultModel);
            setError(undefined);
        }
    }, [mapId])

    return (
        <div>
            <BaseDialog onClose={handleOnClose} onSubmit={handleOnSubmit} error={error}
                title={intl.formatMessage({ id: 'rename.title', defaultMessage: 'Rename' })}
                description={intl.formatMessage({ id: 'rename.description', defaultMessage: 'Please, fill the new map name and description.' })}
                submitButton={intl.formatMessage({ id: 'rename.title', defaultMessage: 'Rename' })}>

                <FormControl fullWidth={true}>
                    <Input name="title" type="text" label={intl.formatMessage({ id: "action.rename-name-placeholder", defaultMessage: "Name" })}
                        value={model.title} onChange={handleOnChange} error={error} fullWidth={true} />

                    <Input name="description" type="text" label={intl.formatMessage({ id: "action.rename-description-placeholder", defaultMessage: "Description" })}
                        value={model.description} onChange={handleOnChange} required={false} fullWidth={true} />
                </FormControl>
            </BaseDialog>
        </div>
    );
}

export default RenameDialog;