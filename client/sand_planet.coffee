Meteor.startup ->
  p $("#box").text()
  $("#box").text("2")
  @common.init()
  p Note
