' ===========================================================================
'  MUSE Bot - silent launcher
'
'  Starts run_bot.bat with no console window. This is the file Windows should
'  run at logon (via a shortcut in the Startup folder).
' ===========================================================================
Option Explicit

Dim fso, shell, botDir, batPath

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

botDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(botDir, "run_bot.bat")

' 0 = hidden window, False = do not wait for it to finish.
shell.Run """" & batPath & """", 0, False
