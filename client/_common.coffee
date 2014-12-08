if @p
  console.log "this has 'p' already."
else
  @p = (args...) -> console.log(args...)

if @common
  console.log "this has 'common' already."
else
  @common = {}
