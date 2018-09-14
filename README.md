# `dsh`
Remotelly run commands using Dat.

![demo-dsh](https://user-images.githubusercontent.com/5105812/45563501-ed55f600-b823-11e8-8165-9edb770e0bdf.gif)

## How it works
Creates a folder (`.datsrc`) with the following content

```
.dsrc/
├── .dat/
├── .dshell
├── .key
└── .datignore
```

The dat folder is created by Dat, so there's nothing to explain here. The 
`.dshell` file is the main file. This is the only file shared through dat to the 
remote peer. It contains the commands to be executed remotely. 

The logic is simple: Once connected to the shell, running `run <command>` will 
write to the local `.dshell` file the command, and replicate it through dat to 
the remote machine. Previously, in the remote machine there should have started 
the listener process `dshd`, this process get the public key of the original 
process as a parameter, and return a second key. This is because we are using 
two dats for bidirectional communication. This should change with multiwriter 
support. The second key is copied in the original machine.

This whole connection process whould happen only once in the original machine, 
and everytime the process start in the remote machine (althought is supposed to 
start once only). 

So, when the remote machine gets an update in the `dshell`file replicated from 
the original one, it will read its content and executed as a child process, the 
will write `stdout` and `stderr` to `.stdout` and `.stderr` to the second Dat 
thats used to replicate output to the originall machine. Finally, the original 
machine will listen to the output update and print it to the console.

## The client (original) process
```bash
$ dsh
dsh > help

  Commands:

    start              Start the Dat connections
    exit               Exits application.
    run [commands...]  Run commands when connected to a Dat
    close              Close connection to Dat
    help [command...]  Provides help for a given command.
```

```bash
$ dsh
dsh > start
Dat link is: dat://2f1e21edde3fae6d62b5b124e03ded374d2717d3398bb20de57700f4348946d6
Enter remote Dat key?
```
## The daemon process
```bash
$ dshd <key>
Dat link is: dat://2f1e21edde3fae6d62b5b124e03ded374d2717d3398bb20de57700f4348946d6
```