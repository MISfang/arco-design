`````
Component / Data Entry

# TimePicker

Select the time on the popup panel to conveniently complete the time input control.
`````

%%Content%%

## API

### Picker

Common properties of `TimePicker` and `RangePicker`

|Property|Description|Type|DefaultValue|Version|
|---|---|---|---|---|
|allowClear|Whether to show clear button|boolean |`true`|-|
|disableConfirm|Disable the confirm step, click to select time directly without click the confirm button.|boolean |`-`|2.12.0|
|disabled|Whether to disable|boolean |`-`|-|
|editable|Whether input box can be entered|boolean |`true`|-|
|error|Error style|boolean |`-`|-|
|hideDisabledOptions|Hide the disabled options|boolean |`-`|-|
|popupVisible|Whether the popup is visible or not|boolean |`-`|-|
|scrollSticky|The time column is automatically adsorbed and selected when scrolling|boolean |`true`|2.23.0|
|unmountOnExit|Whether to destroy popup when hidden|boolean |`-`|-|
|use12Hours|Display as 12 hours format, with default format h:mm:ss a|boolean |`-`|-|
|utcOffset|Set the timezone offset, set to 0 if utc time is required.|number |`-`|-|
|format|Date format, refer to [dayjs](https://github.com/iamkun/dayjs)|string |`HH:mm:ss`|-|
|timezone|timezone name, if `utcOffset` is set, `utcOffset` takes effect.|string |`-`|-|
|position|The position of the popup box|'top' \| 'tl' \| 'tr' \| 'bottom' \| 'bl' \| 'br' |`bl`|-|
|size|Input box size|'mini' \| 'small' \| 'default' \| 'large' |`-`|-|
|extra|Additional content at the bottom|ReactNode |`-`|-|
|className|Additional css class|string \| string[] |`-`|-|
|icons|Used to configure icons|{ inputSuffix?: ReactNode } |`-`|-|
|placeholder|The placeholder of input box|string \| string[] |`-`|-|
|step|Set the hour/minute/second selection interval.|{ hour?: number; minute?: number; second?: number } |`-`|-|
|style|Additional style|CSSProperties |`-`|-|
|triggerProps|The props of the `Trigger` component|Partial&lt;[TriggerProps](trigger#trigger)&gt; |`-`|-|
|disabledHours|To specify the hours that cannot be selected|() => number[] |`-`|-|
|disabledMinutes|To specify the minutes that cannot be selected|(selectedHour) => number[] |`-`|-|
|disabledSeconds|To specify the seconds that cannot be selected|(selectedHour, selectedMinute) => number[] |`-`|-|
|getPopupContainer|The parent node of the popup|(node: HTMLElement) => Element |`-`|-|
|onClear|Callback when click the clear button|() => void |`-`|-|

### TimePicker

|Property|Description|Type|DefaultValue|Version|
|---|---|---|---|---|
|showNowBtn|Whether to show the button to select current time|boolean |`true`|2.21.0|
|defaultValue|To set default time|[CalendarValue](#calendarvalue) |`-`|-|
|value|To set time|[CalendarValue](#calendarvalue) |`-`|-|
|onChange|Callback when selected value changes|(valueString: string, value: Dayjs) => void |`-`|-|
|onSelect|Callback when select time|(valueString: string, value: Dayjs) => void |`-`|-|

### TimePicker.RangePicker

|Property|Description|Type|DefaultValue|Version|
|---|---|---|---|---|
|order|Whether the start and end times are automatically sorted|boolean |`true`|2.21.0|
|defaultValue|To set default time|[CalendarValue](#calendarvalue)[] |`-`|-|
|placeholder|The placeholder of input box|string[] |`-`|-|
|value|To set time|[CalendarValue](#calendarvalue)[] |`-`|-|
|onChange|Callback when the selected value changes|(valueString: string[], value: Dayjs[]) => void |`-`|-|
|onSelect|Callback when select time|(valueString: string[], value: Dayjs[]) => void |`-`|-|

### CalendarValue

```js
export type CalendarValue = Dayjs | Date | string | number;
```
