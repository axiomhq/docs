<div class="axi-header">
  <h1>Tabular Operators</h1>
</div>


**All examples are calculated in the `http-logs` dataset**
## where operator 

Sorts out a dataset to a branch of rows that meets a *state* when executed.

### Syntax

 [dataset name] `where` *state* 

| **Arguments**  | **Returns** |
|------------------------------------|---------------| 
| **`http-logs`:** The dataset whose events are to be sorted,                                                          
<br> **state**: a bool expression over the columns of the dataset `http-logs` , it's then checked for each row in `http-logs` | Row in dataset `http-logs` for which *state* is true.  |

### Example

```
['http-logs']
| where method == 'GET' and content_type == 'image/jpeg'
```

## count operator 

Returns the number of events and all matching events from the dataset. 

### Syntax

['dataset name'] | count


| **Arguments**  | **Returns** |
|------------------------------------|---------------| 
| **['http-logs']:** dataset whose events are to be counted |  a table with a single data and column with. The value of the only cell is the number of events in `http-logs`. |

### Example 

```
['http-logs']
| where method == 'GET'
| count 

```

```
['http-logs']
| count 
```
## extend operator 

Create calculated columns and attach them to the result set.

### Syntax

`<dataset name>` `|extend` [ColumnName|(ColumnName[, ...])=]Expression [, ...] 

| **Arguments**  | **Returns** |
|---------------------------------------|----------------------------------| 
|<ul><li> **['http-logs']:** The input dataset table.     </li><li> **ColumnName:** The name of the column to add or update. *ColumnName* can be the field of your dataset, they are automatically generated for you and a list of column names can be specified in parentheses. </li><li> **Expression:** A calculation over the columns of the input. | </li><li>Column names noted by extend that already exist in the input are removed and appended as their new calculated values.  </li><li>Column names noted by extend that do not exist in the input are appended as their new calculated values.|

### Example

```
['http-logs']
| where _time >= ago(2d)
| extend method , ['geo.city'], ['geo.country'], content_type

```

## project operator

Select the columns to insert, rename, include or drop, and embed new computed columns.

### Syntax

<dataset Name> | project ColumnName [= Expression] [, ...]

| **Arguments**  | **Returns** |
|---------------------------------------|----------------------------------| 
| <ul><li> T: The input table. which is your dataset name.  </li><li> ColumnName (FieldName): Optional name of a column to appear in the output. If there is no Expression, then ColumnName is compulsory and a column of that name must appear in the input.  </li><li> Expression: Optional scalar expression referencing the input columns. If ColumnName is not omitted then Expression is mandatory.  | </li><li> A table that has the columns named as arguments, and as many rows as the input table. |

### Example 

```
['http-logs']
| project ['geo.country'] = ['id']
```

```
['http-logs']
| project ['geo.country'] = ['id'], method = ['geo.city']
```

```
['http-logs']
| project ['geo.city'], content_type, ['geo.country'], ['id'], is_tls
```

## take operator 

Return up to the specified number of rows.

### Syntax

 [dataset name] | `take`  
 
`take` NumberOfRows

### Example 

```
['http-logs']
| take 1000 

```
```

['http-logs']
| take 700

```

## summarize operator 

Produces a table that aggregates the content of the input table.

```
['http-logs']
| summarize histogram(req_duration_ms, 30)
```

Returns a table that shows the `heat-map` in each interval [0, 30], [30, 20, 10], and so on. This example has a cell for `HISTOGRAM(req_duration_ms)`. All other input columns are ignored.

### Syntax 

[Dataset name] | `summarize [[Column =] Aggregation [, ...]] [by [Column =] GroupExpression [, ...]]`

| **Arguments**  | **Returns** |
|---------------------------------------|----------------------------------| 
| <ul><li> Aggregation: A call to an aggregation function such as count() or avg(), with column names as arguments. See the list of aggregation functions. </li><li> Column(`field`): Optional name for a result column. Defaults to a name derived from the expression. </li><li> GroupExpression: A scalar expression that can reference the input data. The output will have as many records as there are distinct values of all the group expressions.| </li><li> The input rows are arranged into groups having the same values of the expressions. The expressions can be `by` expressions. . The specified aggregation functions are computed over each group, producing a row for each group.  (Some aggregation functions return multiple columns.) </li><li> To summarize over ranges of numeric values, use bin() to reduce ranges to discrete values. |

### Example

```
['http-logs']
| summarize histogram(req_duration_ms, 30), count()
```

```
['http-logs']
| where _time > ago(1h)
| summarize topk(content_type, 40)

```