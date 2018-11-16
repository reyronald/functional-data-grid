// @flow

import React from 'react'
import {List, Map} from 'immutable'
import Column from './Column'
import ColumnGroup from './ColumnGroup'
import type { ComputedColumnGroup } from './ComputedColumnGroup'
import { getComputedColumnGroups } from './Utils'

type ColumnsMenuPropsType = {
  leftLockedColumns: List<Column>,
  freeColumns: List<Column>,
  rightLockedColumns: List<Column>,
  columnGroups: List<ColumnGroup>,
  enableColumnsShowAndHide: boolean,
  enableColumnsSorting: boolean,
  columnsVisibility: Map<string, boolean>,
  onColumnVisibilityChange: Function,
  onClose: () => void,
  columnsOrder: List<string>,
  onColumnsOrderChange: List<string> => void
}

type ColumnsMenuStateType = {
  searchValue: string,
}

export default class ColumnsMenu extends React.PureComponent<ColumnsMenuPropsType, ColumnsMenuStateType> {
  
  ref: ?HTMLDivElement

  static defaultProps = {
    enableColumnsShowAndHide: false,
    enableColumnsSorting: false,
    onColumnVisibilityChange: () => {},
    onColumsOrderChange: (columnsOrder: List<string>) => {},
    onClose: () => {}
  }

  constructor(props: ColumnsMenuPropsType) {
    super(props)
    this.state = {
      searchValue: ''
    }
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside, true)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  handleClickOutside = (event: Object) => {
    if (this.ref != null && ! this.ref.contains(event.target)) {
      this.props.onClose()
      event.stopPropagation()
    }
  }

  filterColumns = (searchValue: string) => {
    this.setState({
      searchValue
    })
  }

  filterInitialColumns = (columns: List<Column>, inputValue: string) => columns.filter(c => (c.title.toLowerCase()).includes(inputValue.toLowerCase()))

  render = () => {

    let leftLockedColumns = this.filterInitialColumns(this.props.leftLockedColumns, this.state.searchValue)
    let freeColumns = this.filterInitialColumns(this.props.freeColumns, this.state.searchValue)
    let rightLockedColumns = this.filterInitialColumns(this.props.rightLockedColumns, this.state.searchValue)

    return <div ref={ref => this.ref = ref}
                style={{ backgroundColor: '#ddd', border: 'solid 1px #ccc', lineHeight: '26px', maxHeight: '500px', overflow: 'auto', width:'200px'}}>
            <div className = "functional-data-grid__columns-menu__search" style={{width:'100%',padding:'5px'}}>
              <input onChange={(e: Object) => this.filterColumns(e.target.value)}
                     placeholder={'Search...'}
                     autoFocus="true"
                     style={{width: '100%', boxSizing: 'border-box', paddingLeft:'5px',  height: '20px'}}/>
            </div>
          { leftLockedColumns.size > 0 && this.renderColumnEntries(leftLockedColumns) }
          { freeColumns.size > 0 && <div style={{ borderTop: 'solid 3px #aaa' }}>{ this.renderColumnEntries(freeColumns) }</div> }
          { rightLockedColumns.size > 0 && <div style={{ borderTop: 'solid 3px #aaa' }}>{ this.renderColumnEntries(rightLockedColumns) }</div> }
          </div>
  }

  renderColumnEntries = (columns: List<Column>) => <div >{ getComputedColumnGroups(columns).map(g => this.renderColumnGroup(g)) }</div>

  renderColumnGroup = (g: ComputedColumnGroup) => {
    let columnGroup = g.columnGroup
    return <div>
      { columnGroup != null
        ? <div className="functional-data-grid__columns-menu__column-group" style={{padding: '0 5px', borderTop: 'solid 1px #aaa', whiteSpace: 'nowrap'}}>
            <div className="functional-data-grid__columns-menu__column-group__header" style={{ display: 'flex'}}>
              <b style={{overflow: 'hidden', textOverflow: 'ellipsis'}} title={this.getColumnGroupById(columnGroup).title}>{ this.getColumnGroupById(columnGroup).title }</b>
            </div>
          { g.columns.map((c) => this.renderColumnEntry(c)) }
          </div>
        : <div style={{padding: '0 5px', whiteSpace: 'nowrap'}}>{ g.columns.map((c) => this.renderColumnEntry(c)) }</div>
      }
    </div>
  }

  renderColumnEntry = (c: Column) => {
    return <div key={c.id}
                className="functional-data-grid__columns-menu__column"
                draggable={this.props.enableColumnsSorting}
                onDragStart={this.onDragStart(c.id)}
                onDragOver={this.onDragOver}
                onDrop={this.onDrop(c.id)}
                style={{cursor: this.props.enableColumnsSorting ? 'pointer' : 'auto', display: 'flex'}}>
      { this.props.enableColumnsSorting && <div style={{ paddingRight: '4px', color: '#999' }}>{ String.fromCodePoint(9776) }</div> }
      <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}
           title={c.title}>
        { this.props.enableColumnsShowAndHide && c.enableShowAndHide && <input type="checkbox"
                                                                               checked={this.props.columnsVisibility.get(c.id)}
                                                                               onChange={this.onColumnVisibilityChange(c.id)}
                                                                               style={{ margin: 0, marginRight: '2px' }} /> }
        <span style={{textOverflow: 'ellipsis', overflow: 'hidden'}}>{ c.title }</span>
      </div>
    </div>
  }

  onDragOver = (event: Object) => {
    event.preventDefault()
  }
  
  onDragStart = (columnId: string) => (event: Object) => {
    event.dataTransfer.setData('columnId', columnId)
  }

  onDrop = (columnId: string) => (event: Object) => {
    let sourceColumnId = event.dataTransfer.getData('columnId')
    let targetColumnId = columnId
    this.props.onColumnsOrderChange(this.moveColumnBefore(sourceColumnId, targetColumnId))
    event.dataTransfer.clearData()
  }

  moveColumnBefore = (sourceColumnId: string, targetColumnId: string) => {
    let sourceColumnIndex = this.props.columnsOrder.findIndex(co => co === sourceColumnId)
    let columnsOrderWithoutSourceColumn = this.props.columnsOrder.delete(sourceColumnIndex)
    let targetColumnIndex = columnsOrderWithoutSourceColumn.findIndex(co => co === targetColumnId)
    return columnsOrderWithoutSourceColumn.insert(targetColumnIndex + (sourceColumnIndex > targetColumnIndex ? 0 : 1), sourceColumnId)
  }

  onColumnVisibilityChange = (columnId: string) => (event: Object) => {
    this.props.onColumnVisibilityChange(columnId, event.target.checked)
  }

  getColumnGroupById = (id: string) => this.props.columnGroups.find(g => g.id === id)
}