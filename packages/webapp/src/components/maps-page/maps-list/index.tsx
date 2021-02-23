import React, { useEffect, CSSProperties } from 'react';

import { useStyles } from './styled';
import { useSelector } from 'react-redux';
import { activeInstance, fetchAccount } from '../../../redux/clientSlice';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import Client, { ErrorInfo, MapInfo } from '../../../classes/client';
import ActionChooser, { ActionType } from '../action-chooser';
import ActionDispatcher from '../action-dispatcher';
import dayjs from 'dayjs';
import { Filter, LabelFilter } from '..';
import { FormattedMessage, useIntl } from 'react-intl';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import InputBase from '@material-ui/core/InputBase';
import Link from '@material-ui/core/Link';

import LabelTwoTone from '@material-ui/icons/LabelTwoTone';
import DeleteOutlined from '@material-ui/icons/DeleteOutlined';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import StarRateRoundedIcon from '@material-ui/icons/StarRateRounded';
import SearchIcon from '@material-ui/icons/Search';

// Load fromNow pluggin
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

type Order = 'asc' | 'desc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key
): (
    a: { [key in Key]: number | string | boolean | number[] | undefined },
    b: { [key in Key]: number | string | number[] | boolean }
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
    id: keyof MapInfo;
    label?: string;
    numeric: boolean;
    style?: CSSProperties;
}

interface EnhancedTableProps {
    classes: ReturnType<typeof useStyles>;
    numSelected: number;
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof MapInfo) => void;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
    const intl = useIntl();

    const {
        classes,
        onSelectAllClick,
        order,
        orderBy,
        numSelected,
        rowCount,
        onRequestSort,
    } = props;

    const createSortHandler = (property: keyof MapInfo) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property);
    };

    const headCells: HeadCell[] = [
        {
            id: 'title',
            numeric: false,
            label: intl.formatMessage({ id: 'map.name', defaultMessage: 'Name' }),
        },
        { id: 'labels', numeric: false },
        {
            id: 'createdBy',
            numeric: false,
            label: intl.formatMessage({ id: 'map.creator', defaultMessage: 'Creator' }),
            style: { width: '70px', whiteSpace: 'nowrap' },
        },
        {
            id: 'lastModificationTime',
            numeric: true,
            label: intl.formatMessage({ id: 'map.last-update', defaultMessage: 'Last Update' }),
            style: { width: '70px', whiteSpace: 'nowrap' },
        },
    ];

    return (
        <TableHead>
            <TableRow>
                <TableCell
                    padding="checkbox"
                    key="select"
                    style={{ width: '20px' }}
                    className={classes.headerCell}
                >
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        size="small"
                        inputProps={{ 'aria-label': 'select all desserts' }}
                    />
                </TableCell>

                <TableCell
                    padding="checkbox"
                    key="starred"
                    className={classes.headerCell}
                ></TableCell>

                {headCells.map((headCell) => {
                    return (
                        <TableCell
                            key={headCell.id}
                            sortDirection={orderBy === headCell.id ? order : false}
                            style={headCell.style}
                            className={classes.headerCell}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={createSortHandler(headCell.id)}
                            >
                                {headCell.label}

                                {orderBy === headCell.id && (
                                    <span className={classes.visuallyHidden}>
                                        {order === 'desc'
                                            ? 'sorted descending'
                                            : 'sorted ascending'}
                                    </span>
                                )}
                            </TableSortLabel>
                        </TableCell>
                    );
                })}

                <TableCell
                    padding="checkbox"
                    key="action"
                    className={classes.headerCell}
                ></TableCell>
            </TableRow>
        </TableHead>
    );
}

type ActionPanelState = {
    el: HTMLElement | undefined;
    mapId: number;
};

interface MapsListProps {
    filter: Filter;
}

const mapsFilter = (filter: Filter, search: string): ((mapInfo: MapInfo) => boolean) => {
    return (mapInfo: MapInfo) => {
        // Check for filter condition
        let result = false;
        switch (filter.type) {
            case 'all':
                result = true;
                break;
            case 'starred':
                result = mapInfo.starred;
                break;
            case 'owned':
                result = mapInfo.role == 'owner';
                break;
            case 'shared':
                result = mapInfo.role != 'owner';
                break;
            case 'label':
                result =
                    !mapInfo.labels || mapInfo.labels.includes((filter as LabelFilter).label.id);
                break;
            case 'public':
                result = mapInfo.isPublic;
                break;
            default:
                result = false;
        }

        // Does it match search filter criteria...
        if (search && result) {
            result = mapInfo.title.toLowerCase().indexOf(search.toLowerCase()) != -1;
        }

        return result;
    };
};

export const MapsList = (props: MapsListProps): React.ReactElement => {
    const classes = useStyles();
    const [order, setOrder] = React.useState<Order>('asc');
    const [filter, setFilter] = React.useState<Filter>({ type: 'all' });

    const [orderBy, setOrderBy] = React.useState<keyof MapInfo>('lastModificationTime');
    const [selected, setSelected] = React.useState<number[]>([]);
    const [searchCondition, setSearchCondition] = React.useState<string>('');

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const client: Client = useSelector(activeInstance);
    const intl = useIntl();

    const queryClient = useQueryClient();

    // Configure locale ...
    const account = fetchAccount();
    if (account) {
        dayjs.locale(account.locale.code);
    }

    useEffect(() => {
        setSelected([]);
        setPage(0);
        setFilter(props.filter);
    }, [props.filter.type, (props.filter as LabelFilter).label]);

    const { isLoading, data } = useQuery<unknown, ErrorInfo, MapInfo[]>('maps', () => {
        return client.fetchAllMaps();
    });
    const mapsInfo: MapInfo[] = data ? data.filter(mapsFilter(filter, searchCondition)) : [];

    const [activeRowAction, setActiveRowAction] = React.useState<ActionPanelState | undefined>(
        undefined
    );
    type ActiveDialog = {
        actionType: ActionType;
        mapsId: number[];
    };

    const [activeDialog, setActiveDialog] = React.useState<ActiveDialog | undefined>(undefined);
    const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof MapInfo) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (event.target.checked) {
            const newSelecteds = mapsInfo.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleRowClick = (event: React.MouseEvent<unknown>, id: number): void => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: number[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleActionClick = (mapId: number): ((event) => void) => {
        return (event): void => {
            setActiveRowAction({
                mapId: mapId,
                el: event.currentTarget,
            });
            event.stopPropagation();
        };
    };

    const starredMultation = useMutation<void, ErrorInfo, number>(
        (id: number) => {
            const map = mapsInfo.find((m) => m.id == id);
            return client.updateStarred(id, !map?.starred);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('maps');
            },
            onError: () => {
                // setError(error);
            },
        }
    );

    const handleStarred = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => {
        event.stopPropagation();
        starredMultation.mutate(id);
    };

    const handleActionMenuClose = (action: ActionType): void => {
        if (action) {
            const mapId = activeRowAction?.mapId;

            setActiveDialog({
                actionType: action as ActionType,
                mapsId: [mapId] as number[],
            });
        }
        setActiveRowAction(undefined);
    };

    const handleOnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchCondition(e.target.value);
    };

    const handleDeleteClick = () => {
        setActiveDialog({
            actionType: 'delete',
            mapsId: selected,
        });
    };

    const isSelected = (id: number) => selected.indexOf(id) !== -1;
    return (
        <div className={classes.root}>
            <ActionChooser
                anchor={activeRowAction?.el}
                onClose={handleActionMenuClose}
                mapId={activeRowAction?.mapId}
            />

            <Paper className={classes.paper} elevation={0}>
                <Toolbar className={classes.toolbar} variant="dense">
                    <div className={classes.toolbarActions}>
                        {selected.length > 0 && (
                            <Tooltip arrow={true} title="Delete selected">
                                <Button
                                    color="primary"
                                    size="medium"
                                    variant="outlined"
                                    type="button"
                                    disableElevation={true}
                                    onClick={handleDeleteClick}
                                    startIcon={<DeleteOutlined />}
                                >
                                    <FormattedMessage id="action.delete" defaultMessage="Delete" />
                                </Button>
                            </Tooltip>
                        )}

                        {selected.length > 0 && (
                            <Tooltip arrow={true} title="Add label to selected">
                                <Button
                                    color="primary"
                                    size="medium"
                                    variant="outlined"
                                    type="button"
                                    style={{ marginLeft: '10px' }}
                                    disableElevation={true}
                                    startIcon={<LabelTwoTone />}
                                >
                                    <FormattedMessage
                                        id="action.label"
                                        defaultMessage="Add Label"
                                    />
                                </Button>
                            </Tooltip>
                        )}
                    </div>

                    <div className={classes.toolbarListActions}>
                        <TablePagination
                            style={{ float: 'right', border: '0', paddingBottom: '5px' }}
                            count={mapsInfo.length}
                            rowsPerPageOptions={[]}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onChangePage={handleChangePage}
                            onChangeRowsPerPage={handleChangeRowsPerPage}
                            component="div"
                        />
                        <div className={classes.search}>
                            <div className={classes.searchIcon}>
                                <SearchIcon />
                            </div>
                            <InputBase
                                placeholder="Search…"
                                classes={{
                                    root: classes.searchInputRoot,
                                    input: classes.searchInputInput,
                                }}
                                inputProps={{ 'aria-label': 'search' }}
                                onChange={handleOnSearchChange}
                            />
                        </div>
                    </div>
                </Toolbar>

                <TableContainer>
                    <Table className={classes.table} size="small" stickyHeader>
                        <EnhancedTableHead
                            classes={classes}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={mapsInfo.length}
                        />

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6}>Loading ...</TableCell>
                                </TableRow>
                            ) : mapsInfo.length == 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} style={{ textAlign: 'center' }}>
                                        <FormattedMessage
                                            id="maps.empty-result"
                                            defaultMessage="No matching record found with the current filter criteria."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stableSort(mapsInfo, getComparator(order, orderBy))
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row: MapInfo) => {
                                        const isItemSelected = isSelected(row.id);
                                        const labelId = row.id;

                                        return (
                                            <TableRow
                                                hover
                                                onClick={(event) => handleRowClick(event, row.id)}
                                                role="checkbox"
                                                aria-checked={isItemSelected}
                                                tabIndex={-1}
                                                key={row.id}
                                                selected={isItemSelected}
                                                style={{ border: '0' }}
                                            >
                                                <TableCell
                                                    padding="checkbox"
                                                    className={classes.bodyCell}
                                                >
                                                    <Checkbox
                                                        checked={isItemSelected}
                                                        inputProps={{
                                                            'aria-labelledby': String(labelId),
                                                        }}
                                                        size="small"
                                                    />
                                                </TableCell>

                                                <TableCell
                                                    padding="checkbox"
                                                    className={classes.bodyCell}
                                                >
                                                    <Tooltip arrow={true} title="Starred">
                                                        <IconButton
                                                            aria-label="Starred"
                                                            size="small"
                                                            onClick={(e) =>
                                                                handleStarred(e, row.id)
                                                            }
                                                        >
                                                            <StarRateRoundedIcon
                                                                color="action"
                                                                style={{
                                                                    color: row.starred
                                                                        ? 'yellow'
                                                                        : 'gray',
                                                                }}
                                                            />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell className={classes.bodyCell}>
                                                    <Tooltip
                                                        arrow={true}
                                                        title="Open for edition"
                                                        placement="bottom-start"
                                                    >
                                                        <Link
                                                            href={`/c/maps/${row.id}/edit`}
                                                            color="textPrimary"
                                                            underline="always"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {row.title}
                                                        </Link>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell className={classes.bodyCell}>
                                                    {row.labels}
                                                </TableCell>

                                                <TableCell className={classes.bodyCell}>
                                                    {row.createdBy}
                                                </TableCell>

                                                <TableCell className={classes.bodyCell}>
                                                    <Tooltip
                                                        arrow={true}
                                                        title={`Modified by ${
                                                            row.lastModificationBy
                                                        } on ${dayjs(
                                                            row.lastModificationTime
                                                        ).format('lll')}`}
                                                        placement="bottom-start"
                                                    >
                                                        <span>
                                                            {dayjs(
                                                                row.lastModificationTime
                                                            ).fromNow()}
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell className={classes.bodyCell}>
                                                    <Tooltip
                                                        arrow={true}
                                                        title={intl.formatMessage({
                                                            id: 'map.more-actions',
                                                            defaultMessage: 'More Actions',
                                                        })}
                                                    >
                                                        <IconButton
                                                            aria-label="Others"
                                                            size="small"
                                                            onClick={handleActionClick(row.id)}
                                                        >
                                                            <MoreHorizIcon color="action" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ActionDispatcher
                action={activeDialog?.actionType}
                onClose={() => setActiveDialog(undefined)}
                mapsId={activeDialog ? activeDialog.mapsId : []}
            />
        </div>
    );
};
