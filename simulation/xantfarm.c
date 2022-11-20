/* xantfarm - Insect world - build it up, tear it down.
**
** Copyright (C) 1991 by Jef Poskanzer
**
** Permission to use, copy, modify, and distribute this software and its
** documentation for any purpose and without fee is hereby granted, provided
** that the above copyright notice appear in all copies and that both that
** copyright notice and this permission notice appear in supporting
** documentation.  This software is provided "as is" without express or
** implied warranty.
*/

#ifndef lint
static char rcsid[] =
    "@(#) $Header: xantfarm.c,v 1.16 91/10/23 10:41:59 jef Exp $";
#endif

#include <stdio.h>
#ifdef SYSV
#include <string.h>
#include <sys/termio.h>
#else /*SYSV*/
#include <strings.h>
#endif /*SYSV*/
#include <pwd.h>
#include <sys/types.h>
#include <sys/ioctl.h>
#include <sys/time.h>

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/Xatom.h>
#include <X11/Xresource.h>
#define XTSTRINGDEFINES
#include <X11/StringDefs.h>

/* Add fd_set definitions, in case the system doesn't have them. */
#ifndef FD_SET
#define NFDBITS		32
#define FD_SETSIZE	32
#define FD_SET(n, p)	((p)->fds_bits[(n)/NFDBITS] |= (1 << ((n) % NFDBITS)))
#define FD_CLR(n, p)	((p)->fds_bits[(n)/NFDBITS] &= ~(1 << ((n) % NFDBITS)))
#define FD_ISSET(n, p)	((p)->fds_bits[(n)/NFDBITS] & (1 << ((n) % NFDBITS)))
#define FD_ZERO(p)	bzero((char *)(p), sizeof(*(p)))
#endif


/* Definitions. */

#define X_CLASS "Xantfarm"

/* All of these are probabilities times 1000. */
#define RANDOM_DIG_PROB 3		/* dig down while wandering */
#define RANDOM_DROP_PROB 3		/* drop while wandering */
#define RANDOM_TURN_PROB 5		/* turn while wandering */
#define CONCAVE_BELOW_DIRT_DIG_PROB 100	/* dig a concave dirt below ground */
#define CONVEX_ABOVE_DROP_PROB 100	/* drop at convex corner above ground */
#define CALM_PROB 10			/* calm down from a panic */
#define SAND_EXCLUSION_PROB 50		/* hard to drop sand at sand/dirt */

#define COMPACT 15			/* this depth of sand turns to dirt */
#define DIRT_START_FRAC 0.666666	/* how much starts as dirt */
#define CHECKPOINT_CYCLES 5000		/* how often to checkpoint */

#define GRID_SIZE sand_width
#define ANT_GRIDS ( ant_lu0_width / GRID_SIZE )

/* The three elements. */
#define E_AIR 0
#define E_DIRT 1
#define E_SAND 2

typedef struct ant_struct {
    int x, y;
    int dir;
    int behavior;
    int timer;
    int phase;
    } ant;

/* The eight directions. */
#define D_LEFT_DOWN 0
#define D_LEFT_UP 1
#define D_RIGHT_DOWN 2
#define D_RIGHT_UP 3
#define D_UP_RIGHT 4
#define D_UP_LEFT 5
#define D_DOWN_RIGHT 6
#define D_DOWN_LEFT 7
#define N_DIRS 8
#define N_ALTPIXMAPS 2

/* The three behaviors. */
#define B_WANDERING 0
#define B_CARRYING 1
#define B_PANIC 2

/* Timing factors for the three behaviors. */
#define T_WANDERING 4
#define T_CARRYING 5
#define T_PANIC 1

typedef struct falling_sand_struct {
    int x, y;
    int active;
    } falling_sand;



/* Externals. */

extern char* getenv();
extern char* malloc();
extern long random();
extern char* realloc();
extern long time();


/* Forward routines. */

static void x_init();
static Window VirtualRootWindowOfScreen();
static void x_init_rdb();
static char* x_get_resource();
static int x_str_to_bool();
static int x_get_color_resource();
static void ant_init();
static void new_ant();
static void stealth();
static void main_loop();
static void expose();
static void paint_run();
static void poke();
static void invalidate();
static void invalidate_ant();
static void cleanup();

static void moveants();
static void move();
static void turn();
static int legal_dir();
static int try_dig();
static void loosen_neighbors();
static void loosen_one();
static void drop();
static void behave();
static void sand_fall();
static int read_world();
static void write_world();


/* Variables. */

/* Sand bitmap. */
#define sand_width 4
#define sand_height 4
static char sand_bits[] = {0x0a,0x05,0x0a,0x05};

/* Ant bitmaps. */
#define ant_ld0_width 12
#define ant_ld0_height 4
static char ant_ld0_bits[] = {0x03,0x00,0xec,0x07,0xff,0x07,0x20,0x09};
#define ant_ld1_width 12
#define ant_ld1_height 4
static char ant_ld1_bits[] = {0x03,0x00,0xec,0x07,0xff,0x07,0x90,0x04};
#define ant_lu0_width 12
#define ant_lu0_height 4
static char ant_lu0_bits[] = {0x20,0x09,0xff,0x07,0xec,0x07,0x03,0x00};
#define ant_lu1_width 12
#define ant_lu1_height 4
static char ant_lu1_bits[] = {0x90,0x04,0xff,0x07,0xec,0x07,0x03,0x00};
#define ant_rd0_width 12
#define ant_rd0_height 4
static char ant_rd0_bits[] = {0x00,0x0c,0x7e,0x03,0xfe,0x0f,0x49,0x00};
#define ant_rd1_width 12
#define ant_rd1_height 4
static char ant_rd1_bits[] = {0x00,0x0c,0x7e,0x03,0xfe,0x0f,0x92,0x00};
#define ant_ru0_width 12
#define ant_ru0_height 4
static char ant_ru0_bits[] = {0x49,0x00,0xfe,0x0f,0x7e,0x03,0x00,0x0c};
#define ant_ru1_width 12
#define ant_ru1_height 4
static char ant_ru1_bits[] = {0x92,0x00,0xfe,0x0f,0x7e,0x03,0x00,0x0c};
#define ant_ur0_width 4
#define ant_ur0_height 12
static char ant_ur0_bits[] = {
    0x05,0x05,0x06,0x06,0x04,0x0e,0x06,0x06,0x0e,0x06,0x06,0x08};
#define ant_ur1_width 4
#define ant_ur1_height 12
static char ant_ur1_bits[] = {
    0x05,0x05,0x06,0x06,0x0c,0x06,0x06,0x0e,0x06,0x06,0x0e,0x00};
#define ant_ul0_width 4
#define ant_ul0_height 12
static char ant_ul0_bits[] = {
    0x0a,0x0a,0x06,0x06,0x02,0x07,0x06,0x06,0x07,0x06,0x06,0x01};
#define ant_ul1_width 4
#define ant_ul1_height 12
static char ant_ul1_bits[] = {
    0x0a,0x0a,0x06,0x06,0x03,0x06,0x06,0x07,0x06,0x06,0x07,0x00};
#define ant_dr0_width 4
#define ant_dr0_height 12
static char ant_dr0_bits[] = {
    0x08,0x06,0x06,0x0e,0x06,0x06,0x0e,0x04,0x06,0x06,0x05,0x05};
#define ant_dr1_width 4
#define ant_dr1_height 12
static char ant_dr1_bits[] = {
    0x00,0x0e,0x06,0x06,0x0e,0x06,0x06,0x0c,0x06,0x06,0x05,0x05};
#define ant_dl0_width 4
#define ant_dl0_height 12
static char ant_dl0_bits[] = {
    0x01,0x06,0x06,0x07,0x06,0x06,0x07,0x02,0x06,0x06,0x0a,0x0a};
#define ant_dl1_width 4
#define ant_dl1_height 12
static char ant_dl1_bits[] = {
    0x00,0x07,0x06,0x06,0x07,0x06,0x06,0x03,0x06,0x06,0x0a,0x0a};
#define antc_ld0_width 12
#define antc_ld0_height 4
static char antc_ld0_bits[] = {0x03,0x00,0xed,0x07,0xff,0x07,0x20,0x09};
#define antc_ld1_width 12
#define antc_ld1_height 4
static char antc_ld1_bits[] = {0x03,0x00,0xed,0x07,0xff,0x07,0x90,0x04};
#define antc_lu0_width 12
#define antc_lu0_height 4
static char antc_lu0_bits[] = {0x20,0x09,0xff,0x07,0xed,0x07,0x03,0x00};
#define antc_lu1_width 12
#define antc_lu1_height 4
static char antc_lu1_bits[] = {0x90,0x04,0xff,0x07,0xed,0x07,0x03,0x00};
#define antc_rd0_width 12
#define antc_rd0_height 4
static char antc_rd0_bits[] = {0x00,0x0c,0x7e,0x0b,0xfe,0x0f,0x49,0x00};
#define antc_rd1_width 12
#define antc_rd1_height 4
static char antc_rd1_bits[] = {0x00,0x0c,0x7e,0x0b,0xfe,0x0f,0x92,0x00};
#define antc_ru0_width 12
#define antc_ru0_height 4
static char antc_ru0_bits[] = {0x49,0x00,0xfe,0x0f,0x7e,0x0b,0x00,0x0c};
#define antc_ru1_width 12
#define antc_ru1_height 4
static char antc_ru1_bits[] = {0x92,0x00,0xfe,0x0f,0x7e,0x0b,0x00,0x0c};
#define antc_ur0_width 4
#define antc_ur0_height 12
static char antc_ur0_bits[] = {
    0x07,0x05,0x06,0x06,0x04,0x0e,0x06,0x06,0x0e,0x06,0x06,0x08};
#define antc_ur1_width 4
#define antc_ur1_height 12
static char antc_ur1_bits[] = {
    0x07,0x05,0x06,0x06,0x0c,0x06,0x06,0x0e,0x06,0x06,0x0e,0x00};
#define antc_ul0_width 4
#define antc_ul0_height 12
static char antc_ul0_bits[] = {
    0x0e,0x0a,0x06,0x06,0x02,0x07,0x06,0x06,0x07,0x06,0x06,0x01};
#define antc_ul1_width 4
#define antc_ul1_height 12
static char antc_ul1_bits[] = {
    0x0e,0x0a,0x06,0x06,0x03,0x06,0x06,0x07,0x06,0x06,0x07,0x00};
#define antc_dr0_width 4
#define antc_dr0_height 12
static char antc_dr0_bits[] = {
    0x08,0x06,0x06,0x0e,0x06,0x06,0x0e,0x04,0x06,0x06,0x05,0x07};
#define antc_dr1_width 4
#define antc_dr1_height 12
static char antc_dr1_bits[] = {
    0x00,0x0e,0x06,0x06,0x0e,0x06,0x06,0x0c,0x06,0x06,0x05,0x07};
#define antc_dl0_width 4
#define antc_dl0_height 12
static char antc_dl0_bits[] = {
    0x01,0x06,0x06,0x07,0x06,0x06,0x07,0x02,0x06,0x06,0x0a,0x0e};
#define antc_dl1_width 4
#define antc_dl1_height 12
static char antc_dl1_bits[] = {
    0x00,0x07,0x06,0x06,0x07,0x06,0x06,0x03,0x06,0x06,0x0a,0x0e};

static char* argv0;

static char* app_name;
static Display* display;
static Screen* screen;
static Window root;
static int root_w, root_h, root_d;
static GC airgc;
static GC sandgc;
static Pixmap sand_pixmap;
static GC antgc;
static char* ant_bits[N_DIRS][N_ALTPIXMAPS] = {
    ant_ld0_bits, ant_ld1_bits, ant_lu0_bits, ant_lu1_bits,
    ant_rd0_bits, ant_rd1_bits, ant_ru0_bits, ant_ru1_bits,
    ant_ur0_bits, ant_ur1_bits, ant_ul0_bits, ant_ul1_bits,
    ant_dr0_bits, ant_dr1_bits, ant_dl0_bits, ant_dl1_bits };
static char* antc_bits[N_DIRS][N_ALTPIXMAPS] = {
    antc_ld0_bits, antc_ld1_bits, antc_lu0_bits, antc_lu1_bits,
    antc_rd0_bits, antc_rd1_bits, antc_ru0_bits, antc_ru1_bits,
    antc_ur0_bits, antc_ur1_bits, antc_ul0_bits, antc_ul1_bits,
    antc_dr0_bits, antc_dr1_bits, antc_dl0_bits, antc_dl1_bits };
static int ant_width[N_DIRS] = {
    ant_ld0_width, ant_lu0_width, ant_rd0_width, ant_ru0_width,
    ant_ur0_width, ant_ul0_width, ant_dr0_width, ant_dl0_width };
static int ant_height[N_DIRS] = {
    ant_ld0_height, ant_lu0_height, ant_rd0_height, ant_ru0_height,
    ant_ur0_height, ant_ul0_height, ant_dr0_height, ant_dl0_height };
static Pixmap ant_pixmap[N_DIRS][N_ALTPIXMAPS];
static Pixmap antc_pixmap[N_DIRS][N_ALTPIXMAPS];
static int num_exposerects, max_exposerects;
static XRectangle* exposerects;

static int cycles;
static char* checkpoint_file;
static int world_w, world_h;
static int surface;
static unsigned char** world;
static ant* ants;
static int num_ants;
static int dx[N_DIRS] = { -1, -1, 1, 1, 0, 0, 0, 0 };
static int dy[N_DIRS] = { 0, 0, 0, 0, -1, -1, 1, 1 };
static int foot_dir[N_DIRS] = {
    D_DOWN_RIGHT, D_UP_RIGHT, D_DOWN_LEFT, D_UP_LEFT,
    D_RIGHT_DOWN, D_LEFT_DOWN, D_RIGHT_UP, D_LEFT_UP };
static int back_dir[N_DIRS] = {
    D_UP_LEFT, D_DOWN_LEFT, D_UP_RIGHT, D_DOWN_RIGHT,
    D_LEFT_UP, D_RIGHT_UP, D_LEFT_DOWN, D_RIGHT_DOWN };
#define D_LEFT_DOWN 0
#define D_LEFT_UP 1
#define D_RIGHT_DOWN 2
#define D_RIGHT_UP 3
#define D_UP_RIGHT 4
#define D_UP_LEFT 5
#define D_DOWN_RIGHT 6
#define D_DOWN_LEFT 7
static int num_falling_sands, max_falling_sands;
static falling_sand* falling_sands;


/* Routines. */

void
main( argc, argv )
    int argc;
    char* argv[];
    {
    int printpid;

    argv0 = argv[0];
    app_name = "xantfarm";

    /* Initialize X stuff. */
    x_init( &argc, argv );

    /* Now parse the rest of the args. */
    num_ants = 10;
    cycles = 15;
    printpid = 0;
    checkpoint_file = (char*) 0;
    for( ; ; )
	{
	if ( argc >= 3 && strcmp( argv[1], "-num" ) == 0 )
	    {
	    ++argv; --argc;
	    num_ants = atoi( argv[1] );
	    if ( num_ants <= 0 )
		goto usage;
	    ++argv; --argc;
	    continue;
	    }
	if ( argc >= 3 && strcmp( argv[1], "-c" ) == 0 )
	    {
	    ++argv; --argc;
	    cycles = atoi( argv[1] );
	    if ( cycles < 0 )
		goto usage;
	    ++argv; --argc;
	    continue;
	    }
	if ( argc >= 2 && strcmp( argv[1], "-id" ) == 0 )
	    {
	    ++argv; --argc;
	    printpid = 1;
	    continue;
	    }
	if ( argc >= 2 && argv[1][0] != '-' && checkpoint_file == (char*) 0 )
	    {
	    checkpoint_file = argv[1];
	    ++argv; --argc;
	    continue;
	    }
	break;
	}

    if ( argc > 1 )
	{
usage:
	(void) fprintf(
	    stderr,
	    "usage: %s [-num num] [-c cycles] [-id] [checkpointfile]\n",
	    argv0 );
	exit( 1 );
	}

    /* Initialize the random number generator. */
    srandom( (int) ( time( (long*) 0 ) ^ getpid() ) );

    /* Create the ant world. */
    ant_init();

    /* Fork, if necessary. */
    if ( printpid )
	stealth();

    /* Main loop. */
    main_loop();

    /*NOTREACHED*/
    }

static void
x_init( argcP, argv )
    int* argcP;
    char** argv;
    {
    char* display_name;
    char rname[500], rclass[500];
    char* rval;
    int i, j;
    int reverse_video;
    unsigned long foreground, background;
    unsigned long air_color, sand_color, ant_color;

    /* Scan args looking for a -display. */
    display_name = (char*) 0;
    for ( i = 1; i + 1 < *argcP; ++i )
	{
	if ( strcmp( argv[i], "-display" ) == 0 ||
	     strcmp( argv[i], "-displa" ) == 0 ||
	     strcmp( argv[i], "-displ" ) == 0 ||
	     strcmp( argv[i], "-disp" ) == 0 ||
	     strcmp( argv[i], "-dis" ) == 0 ||
	     strcmp( argv[i], "-di" ) == 0 ||
	     strcmp( argv[i], "-d" ) == 0 )
	    {
	    display_name = argv[i + 1];
	    for ( i = i + 2; i <= *argcP; ++i )
		argv[i - 2] = argv[i];
	    *argcP -= 2;
	    break;
	    }
	}

    display = XOpenDisplay( display_name );
    if ( display == (Display*) 0 )
	{
	(void) fprintf(
	    stderr, "%s: can't open display \"%s\"\n", argv0,
	    XDisplayName( display_name ) );
	exit( 1 );
	}

    screen = DefaultScreenOfDisplay( display );
    root = VirtualRootWindowOfScreen( screen );
    root_w = WidthOfScreen( screen );
    root_h = HeightOfScreen( screen );
    root_d = DefaultDepthOfScreen( screen );

    x_init_rdb( argcP, argv );

    (void) sprintf( rname, "%s.%s", app_name, XtNname );
    (void) sprintf( rclass, "%s.%s", X_CLASS, "Name" );
    rval = x_get_resource( rname, rclass );
    if ( rval != (char*) 0 )
	app_name = rval;

    (void) sprintf( rname, "%s.%s", app_name, "synchronous" );
    (void) sprintf( rclass, "%s.%s", X_CLASS, "Synchronous" );
    rval = x_get_resource( rname, rclass );
    if ( rval != (char*) 0 )
	if ( x_str_to_bool( rval ) )
	    XSynchronize( display, True );

    reverse_video = 0;
    (void) sprintf( rname, "%s.%s", app_name, XtNreverseVideo );
    (void) sprintf( rclass, "%s.%s", X_CLASS, XtCReverseVideo );
    rval = x_get_resource( rname, rclass );
    if ( rval != (char*) 0 )
	reverse_video = x_str_to_bool( rval );

    if ( ! x_get_color_resource( XtNforeground, XtCForeground, &foreground ) )
	foreground = BlackPixelOfScreen( screen );

    if ( ! x_get_color_resource( XtNbackground, XtCBackground, &background ) )
	background = WhitePixelOfScreen( screen );

    if ( reverse_video )
	{
	unsigned long t;

	t = foreground;
	foreground = background;
	background = t;
	}

    if ( ! x_get_color_resource( "airColor", XtCColor, &air_color ) )
	air_color = background;
    airgc = XCreateGC( display, root, 0, (XGCValues*) 0 );
    XSetForeground( display, airgc, air_color );

    if ( ! x_get_color_resource( "sandColor", XtCColor, &sand_color ) )
	sand_color = foreground;
    sandgc = XCreateGC( display, root, 0, (XGCValues*) 0 );
    XSetForeground( display, sandgc, sand_color );
    XSetBackground( display, sandgc, background );
    XSetFillStyle( display, sandgc, FillTiled );
    sand_pixmap = XCreatePixmapFromBitmapData(
	display, root, sand_bits, sand_width, sand_height, sand_color,
	background, root_d );
    XSetTile( display, sandgc, sand_pixmap );

    if ( ! x_get_color_resource( "antColor", XtCColor, &ant_color ) )
	ant_color = foreground;
    antgc = XCreateGC( display, root, 0, (XGCValues*) 0 );
    XSetForeground( display, antgc, ant_color );
    XSetBackground( display, antgc, background );
    for ( i = 0; i < N_DIRS; ++i )
	for ( j = 0; j < N_ALTPIXMAPS; ++j )
	    {
	    ant_pixmap[i][j] = XCreateBitmapFromData(
		display, root, ant_bits[i][j], ant_width[i], ant_height[i] );
	    antc_pixmap[i][j] = XCreateBitmapFromData(
		display, root, antc_bits[i][j], ant_width[i], ant_height[i] );
	    }
    num_exposerects = max_exposerects = 0;
    }

/* From vroot.h by Andreas Stolcke. */
static Window
VirtualRootWindowOfScreen( screen )
    Screen* screen;
    {
    static Screen* save_screen = (Screen*) 0;
    static Window root = (Window) 0;

    if ( screen != save_screen )
	{
	Display* dpy = DisplayOfScreen( screen );
	Atom __SWM_VROOT = None;
	int i;
	Window rootReturn, parentReturn;
	Window* children;
	unsigned int numChildren;

	root = RootWindowOfScreen( screen );

	/* Go look for a virtual root. */
	__SWM_VROOT = XInternAtom( dpy, "__SWM_VROOT", False );
	if ( XQueryTree(
		 dpy, root, &rootReturn, &parentReturn, &children,
		 &numChildren ) )
	    {
	    for ( i = 0; i < numChildren; ++i)
		{
		Atom actual_type;
		int actual_format;
		unsigned long nitems, bytesafter;
		Window* newRoot = (Window*) 0;

		if ( XGetWindowProperty(
			 dpy, children[i], __SWM_VROOT, 0, 1, False, XA_WINDOW,
			 &actual_type, &actual_format, &nitems, &bytesafter,
			 (unsigned char**) &newRoot ) == Success && newRoot )
		    {
		    root = *newRoot;
		    break;
		    }
		}
	    if ( children )
		XFree( (char*) children );
	    }
	save_screen = screen;
	}

    return root;
    }

/* Resources stuff, extracted from libwin. */

static XrmDatabase rdb;

static XrmOptionDescRec x_options[] = {
{"-air",         "*airColor",                  XrmoptionSepArg, (caddr_t) 0},
{"-ant",         "*antColor",                  XrmoptionSepArg, (caddr_t) 0},
{"-background",  "*background",                XrmoptionSepArg, (caddr_t) 0},
{"-bg",          "*background",                XrmoptionSepArg, (caddr_t) 0},
{"-fg",          "*foreground",                XrmoptionSepArg, (caddr_t) 0},
{"-foreground",  "*foreground",                XrmoptionSepArg, (caddr_t) 0},
{"-name",        ".name",                      XrmoptionSepArg, (caddr_t) 0},
{"-reverse",     "*reverseVideo",              XrmoptionNoArg,  (caddr_t) "on"},
{"-rv",          "*reverseVideo",              XrmoptionNoArg,  (caddr_t) "on"},
{"-sand",        "*sandColor",                 XrmoptionSepArg, (caddr_t) 0},
{"-synchronous", "*synchronous",               XrmoptionNoArg,  (caddr_t) "on"},
{"-xrm",         (char*) 0,                    XrmoptionResArg, (caddr_t) 0},
};

static void
x_init_rdb( argcP, argv )
    int* argcP;
    char** argv;
    {
    char* resource_string;
    char* xenv;

    XrmInitialize();

    /* Get resource database from server. */
    resource_string = XResourceManagerString( display );
    if ( resource_string != (char*) 0 )
	rdb = XrmGetStringDatabase( resource_string );
    else
	{
	/* No server database, try ~/.Xdefaults */
	char* cp;
	char buf[500];

	cp = getenv( "HOME" );
	if ( cp != (char*) 0 )
	    (void) strcpy( buf, cp );
	else
	    {
	    struct passwd* pw;

	    cp = getenv( "USER" );
	    if ( cp != (char*) 0 )
		pw = getpwnam( cp );
	    else
		pw = getpwuid( getuid() );
	    if ( pw != (struct passwd*) 0 )
		(void) strcpy( buf, pw->pw_dir );
	    else
		(void) strcpy( buf, "." );	/* best we can do */
	    }
	(void) strcat( buf, "/.Xdefaults" );
	rdb = XrmGetFileDatabase( buf );
	}

    /* Merge in XENVIRONMENT, if any. */
    xenv = getenv( "XENVIRONMENT" );
    if ( xenv != (char*) 0 )
	{
	XrmDatabase tdb;

	tdb = XrmGetFileDatabase( xenv );
	XrmMergeDatabases( tdb, &rdb );
	}

    /* And add command line options. */
    XrmParseCommand(
	&rdb, x_options, sizeof(x_options) / sizeof(*x_options),
	app_name, argcP, argv );
    }

static char*
x_get_resource( name, class )
    char* name;
    char* class;
    {
    char* type;
    XrmValue value;

    if ( XrmGetResource( rdb, name, class, &type, &value ) == True )
	if ( strcmp( type, XtRString ) == 0 )
	    return (char*) value.addr;
    return (char*) 0;
    }

static int
x_str_to_bool( str )
    char* str;
    {
    if ( strcmp( str, "true" ) == 0 ||
         strcmp( str, "True" ) == 0 ||
         strcmp( str, "yes" ) == 0 ||
         strcmp( str, "Yes" ) == 0 ||
         strcmp( str, "on" ) == 0 ||
         strcmp( str, "On" ) == 0 ||
         strcmp( str, "1" ) == 0 )
	return 1;
    return 0;
    }


static int
x_get_color_resource( name, class, cP )
    char* name;
    char* class;
    unsigned long* cP;
    {
    char rname[500], rclass[500];
    char* rval;
    XColor color;

    (void) sprintf( rname, "%s.%s", app_name, name );
    (void) sprintf( rclass, "%s.%s", X_CLASS, class );
    rval = x_get_resource( rname, rclass );
    if ( rval == (char*) 0 )
	return 0;
    if ( XParseColor( display, DefaultColormapOfScreen( screen ), rval,
		      &color ) != True )
	{
	(void) fprintf( stderr, "%s: can't parse color \"%s\"\n", argv0, rval );
	exit( 1 );
	}
    if ( XAllocColor( display, DefaultColormapOfScreen( screen ), &color ) !=
	 True )
	{
	(void) fprintf(
	    stderr, "%s: can't allocate color \"%s\"\n", argv0, rval );
	exit( 1 );
	}
    *cP = color.pixel;
    return 1;
    }

static void
ant_init()
    {
    int x, y, a;
    FILE* cfP;

    /* Initialize world. */
    world_w = root_w / GRID_SIZE;
    world_h = root_h / GRID_SIZE;
    world = (unsigned char**) malloc(
	(unsigned) ( world_h * sizeof(unsigned char*) ) );
    if ( world == (unsigned char**) 0 )
	{
	(void) fprintf( stderr, "%s: out of memory\n", argv0 );
	exit( 1 );
	}
    for ( y = 0; y < world_h; ++y )
	{
	world[y] = (unsigned char*) malloc(
	    (unsigned) ( world_w * sizeof(unsigned char) ) );
	if ( world[y] == (unsigned char*) 0 )
	    {
	    (void) fprintf( stderr, "%s: out of memory\n", argv0 );
	    exit( 1 );
	    }
	}
    surface = world_h * ( 1.0 - DIRT_START_FRAC );
    if ( checkpoint_file == (char*) 0 || ! read_world( checkpoint_file ) )
	{
	/* Make a new world. */
	for ( y = 0; y < surface; ++y )
	    for ( x = 0; x < world_w; ++x )
		world[y][x] = E_AIR;
	for ( ; y < world_h; ++y )
	    for ( x = 0; x < world_w; ++x )
		world[y][x] = E_DIRT;
	}

    /* Initialize ants. */
    ants = (ant*) malloc( (unsigned) ( num_ants * sizeof(ant) ) );
    if ( ants == (ant*) 0 )
	{
	(void) fprintf( stderr, "%s: out of memory\n", argv0 );
	exit( 1 );
	}
    for ( a = 0; a < num_ants; ++a )
	new_ant( a );

    /* And falling sand. */
    num_falling_sands = max_falling_sands = 0;
    }

static void
new_ant( a )
    int a;
    {
    ants[a].x = random() % world_w;
    ants[a].y = 1;
    ants[a].dir = random() % N_DIRS;
    behave( a, B_WANDERING, T_WANDERING );
    ants[a].phase = 0;
    }

static void
stealth()
    {
    int pid, tty;

    pid = fork();
    if ( pid < 0 )
	{
	perror( "fork" );
	exit( 1 );
	}
    else if ( pid > 0 )
	/* Parent just exits. */
	exit( 0 );
    (void) printf( "%d\n", getpid() );
    (void) fflush( stdout );

    /* Go stealth (ditch our controlling tty). */
    tty = open( "/dev/tty", 0 );
    if ( tty < 0 )
	{
	(void) fprintf( stderr, "%s: ", argv0 );
	perror( "/dev/tty open" );
	exit( 1 );
	}
    else
	{
	if ( ioctl( tty, TIOCNOTTY, 0 ) < 0 )
	    {
	    (void) fprintf( stderr, "%s: ", argv0 );
	    perror( "TIOCNOTTY ioctl" );
	    exit( 1 );
	    }
	(void) close( tty );
	}
    }

static void
main_loop()
    {
    FILE* cfP;
    int fd, i;
    long clock;
    fd_set fds;
    struct timeval timeout;
    XEvent ev;

    if ( checkpoint_file == (char*) 0 )
	cfP = (FILE*) 0;
    else
	{
	cfP = fopen( checkpoint_file, "r+" );
	if ( cfP == (FILE*) 0 )
	    {
	    cfP = fopen( checkpoint_file, "w" );
	    if ( cfP == (FILE*) 0 )
		(void) fprintf(
		    stderr, "%s: warning, can't create checkpoint file %s\n",
		    argv0, checkpoint_file );
	    }
	}
    XSelectInput( display, root, ExposureMask | PointerMotionMask );
    invalidate( 0, 0, world_w, world_h );
    FD_ZERO( &fds );
    fd = ConnectionNumber( display );
    clock = 0;
    for (;;)
	{
	if ( num_exposerects != 0 )
	    {
	    for ( i = 0; i < num_exposerects; ++i )
		expose(
		    exposerects[i].x, exposerects[i].y,
		    (int) exposerects[i].width, (int) exposerects[i].height );
	    num_exposerects = 0;
	    continue;
	    }
	if ( cycles != 0 && XPending( display ) == 0 )
	    {
	    /* No X events to handle, so wait for a while. */
	    FD_SET( fd, &fds );
	    timeout.tv_sec = 1 / cycles;
	    timeout.tv_usec = 1000000L / cycles;
	    (void) select( fd + 1, &fds, (int*) 0, (int*) 0, &timeout );
	    }
	if ( XPending( display ) == 0 )
	    {
	    /* Still no X events, so let's move. */
	    moveants();
	    if ( num_falling_sands > 0 )
		sand_fall();
	    ++clock;
	    if ( cfP != (FILE*) 0 && clock % CHECKPOINT_CYCLES == 0 )
		write_world( cfP );
	    continue;
	    }
	/* Now there are X events. */
	XNextEvent( display, &ev );
	switch ( ev.type )
	    {
	    case Expose:
	    expose(
		ev.xexpose.x, ev.xexpose.y,
		ev.xexpose.width, ev.xexpose.height );
	    break;

	    case MotionNotify:
	    poke( ev.xmotion.x, ev.xmotion.y );
	    break;
	    }
	}
    }

static void
expose( ex, ey, ew, eh )
    int ex, ey, ew, eh;
    {
    int x0, y0, x1, y1, x, y, a, d, ax, ay;
    int run_start, run_count, run_type;

    /* Convert to ant world coordinates. */
    x0 = ex / GRID_SIZE;
    if ( x0 < 0 ) x0 = 0;
    y0 = ey / GRID_SIZE;
    if ( y0 < 0 ) y0 = 0;
    x1 = ( ex + ew - 1 ) / GRID_SIZE;
    if ( x1 >= world_w ) x1 = world_w - 1;
    y1 = ( ey + eh - 1 ) / GRID_SIZE;
    if ( y1 >= world_h ) y1 = world_h - 1;

    /* Paint the ant world. */
    for ( y = y0; y <= y1; ++y )
	{
	/* Collect up a run of identical elements, so we can paint them
	** all at once and save oodles of cycles.
	*/
	run_start = x0;
	run_count = 1;
	run_type = world[y][x0];
	for ( x = x0 + 1; x <= x1; ++x )
	    {
	    if ( world[y][x] == run_type )
		++run_count;
	    else
		{
		paint_run( run_start, run_count, run_type, y );
		run_start = x;
		run_count = 1;
		run_type = world[y][x];
		}
	    }
	if ( run_count > 0 )
	    paint_run( run_start, run_count, run_type, y );
	}

    /* Now paint any ants in the exposed area. */
    for ( a = 0; a < num_ants; ++a )
	{
	if ( ants[a].x + ANT_GRIDS / 2 >= x0 &&
	     ants[a].x - ANT_GRIDS / 2 <= x1 &&
	     ants[a].y + ANT_GRIDS / 2 >= y0 &&
	     ants[a].y - ANT_GRIDS / 2 <= y1 )
	    {
	    d = ants[a].dir;
	    ax = ants[a].x * GRID_SIZE - ant_width[d] / 2 + GRID_SIZE / 2;
	    ay = ants[a].y * GRID_SIZE - ant_height[d] / 2 + GRID_SIZE / 2;
	    if ( ants[a].behavior == B_CARRYING )
		XSetClipMask( display, antgc, antc_pixmap[d][ants[a].phase] );
	    else
		XSetClipMask( display, antgc, ant_pixmap[d][ants[a].phase] );
	    XSetClipOrigin( display, antgc, ax, ay );
	    XFillRectangle(
		display, root, antgc, ax, ay, ant_width[d], ant_height[d] );
	    }
	}
    }

static void
paint_run( run_start, run_count, run_type, y )
    int run_start, run_count, run_type, y;
    {
    switch ( run_type )
	{
	case E_AIR:
	XFillRectangle(
	    display, root, airgc, run_start * GRID_SIZE, y * GRID_SIZE,
	    run_count * GRID_SIZE, GRID_SIZE );
	break;

	case E_DIRT:
	/* Dirt shows as the default root pattern. */
	XClearArea(
	    display, root, run_start * GRID_SIZE, y * GRID_SIZE,
	    run_count * GRID_SIZE, GRID_SIZE, False );
	break;

	case E_SAND:
	XFillRectangle(
	    display, root, sandgc, run_start * GRID_SIZE, y * GRID_SIZE,
	    run_count * GRID_SIZE, GRID_SIZE );
	break;
	}
    }

static void
poke( px, py )
    int px, py;
    {
    int x, y, a, nx, ny;

    x = px / GRID_SIZE;
    y = py / GRID_SIZE;
    for ( a = 0; a < num_ants; ++a )
	{
	if ( x >= ants[a].x - ANT_GRIDS / 2 && x <= ants[a].x + ANT_GRIDS / 2 &&
	     y >= ants[a].y - ANT_GRIDS / 2 && y <= ants[a].y + ANT_GRIDS / 2 )
	    {
	    /* Drop sand. */
	    if ( ants[a].behavior == B_CARRYING )
		drop( a );
	    /* Push. */
	    nx = ants[a].x;
	    ny = ants[a].y;
	    if ( x == nx && y == ny )
		{
		/* If the cursor is dead on top of the ant, push randomly. */
		nx += random() % 3 - 1;
		ny += random() % 3 - 1;
		}
	    else
		{
		/* Otherwise push away from the cursor. */
		if ( x < nx )
		    ++nx;
		else if ( x > nx )
		    --nx;
		if ( y < ny )
		    ++ny;
		else if ( y > ny )
		    --ny;
		}
	    if ( nx < 0 ) nx = 0;
	    if ( ny < 0 ) ny = 0;
	    if ( nx >= world_w ) nx = world_w - 1;
	    if ( ny >= world_h ) ny = world_h - 1;
	    if ( nx != ants[a].x || ny != ants[a].y )
		{
		invalidate_ant( a );
		ants[a].x = nx;
		ants[a].y = ny;
		}
	    ants[a].dir = random() % N_DIRS;
	    invalidate_ant( a );
	    behave( a, B_PANIC, T_PANIC );
	    }
	}
    }

static void
invalidate( x, y, w, h )
    int x, y, w, h;
    {
    int i, ex, ey, ew, eh;;

    x *= GRID_SIZE;
    y *= GRID_SIZE;
    w *= GRID_SIZE;
    h *= GRID_SIZE;

    /* Check if this rectangle intersects an existing one. */
    for ( i = 0; i < num_exposerects; ++i )
	{
	ex = exposerects[i].x;
	ey = exposerects[i].y;
	ew = exposerects[i].width;
	eh = exposerects[i].height;
	if ( x < ex + ew && ex < x + w && y < ey + eh && ey < y + h )
	    {
	    /* Found an intersection - merge them. */
	    if ( x + w > ex + ew )
		exposerects[i].width = ew = x + w - ex;
	    if ( y + h > ey + eh )
		exposerects[i].height = eh = y + h - ey;
	    if ( x < ex )
		{
		exposerects[i].width = ex + ew - x;
		exposerects[i].x = x;
		}
	    if ( y < ey )
		{
		exposerects[i].height = ey + eh - y;
		exposerects[i].y = y;
		}
	    return;
	    }
	}

    /* Nope, add a new XRectangle. */
    if ( num_exposerects == max_exposerects )
	{
	if ( max_exposerects == 0 )
	    {
	    max_exposerects = 32;
	    exposerects = (XRectangle*) malloc(
		(unsigned) ( max_exposerects * sizeof(XRectangle) ) );
	    }
	else
	    {
	    max_exposerects *= 2;
	    exposerects = (XRectangle*) realloc(
		(char*) exposerects,
		(unsigned) ( max_exposerects * sizeof(XRectangle) ) );
	    }
	if ( exposerects == (XRectangle*) 0 )
	    {
	    (void) fprintf( stderr, "%s: out of memory\n", argv0 );
	    exit( 1 );
	    }
	}
    exposerects[num_exposerects].x = x;
    exposerects[num_exposerects].y = y;
    exposerects[num_exposerects].width = w;
    exposerects[num_exposerects].height = h;
    ++num_exposerects;
    }

static void
invalidate_ant( a )
    int a;
    {
    invalidate(
	ants[a].x - ANT_GRIDS / 2, ants[a].y - ANT_GRIDS / 2,
	ANT_GRIDS, ANT_GRIDS );
    }

static void
cleanup()
    {
    int i, j;

    XFreePixmap( display, sand_pixmap );
    for ( i = 0; i < N_DIRS; ++i )
	for ( j = 0; j < N_ALTPIXMAPS; ++j )
	    {
	    XFreePixmap( display, ant_pixmap[i][j] );
	    XFreePixmap( display, antc_pixmap[i][j] );
	    }
    XFreeGC( display, airgc );
    XFreeGC( display, sandgc );
    XFreeGC( display, antgc );
    XCloseDisplay( display );
    }

static void
moveants()
    {
    int a, x, y, fx, fy;

    for ( a = 0; a < num_ants; ++a )
	{
	--ants[a].timer;
	if ( ants[a].timer <= 0 )
	    {
	    ants[a].phase = ( ants[a].phase + 1 ) % N_ALTPIXMAPS;

	    /* Gravity check. */
	    x = ants[a].x;
	    y = ants[a].y;
	    fx = x + dx[foot_dir[ants[a].dir]];
	    fy = y + dy[foot_dir[ants[a].dir]];
	    if ( fx >= 0 && fx < world_w && fy >= 0 && fy < world_h &&
		 world[fy][fx] == E_AIR )
		{
		/* Whoops, whatever we were walking on disappeared. */
		if ( y + 1 < world_h && world[y + 1][x] == E_AIR )
		    {
		    invalidate_ant( a );
		    ants[a].y = y + 1;
		    invalidate_ant( a );
		    }
		else
		    /* Can't fall?  Try turning. */
		    turn( a );
		}
	    else
		{
		/* Ok, the ant gets to do something. */
		switch ( ants[a].behavior )
		    {
		    case B_WANDERING:
		    if ( random() % 1000 < RANDOM_DIG_PROB )
			(void) try_dig( a, 0 );
		    else if ( random() % 1000 < RANDOM_TURN_PROB )
			turn( a );
		    else
			{
			behave( a, B_WANDERING, T_WANDERING );
			move( a );
			}
		    break;

		    case B_CARRYING:
		    if ( random() % 1000 < RANDOM_DROP_PROB )
			drop( a );
		    else
			{
			behave( a, B_CARRYING, T_CARRYING );
			move( a );
			}
		    break;

		    case B_PANIC:
		    if ( random() % 1000 < CALM_PROB )
			{
			behave( a, B_WANDERING, T_WANDERING );
			}
		    else
			{
			behave( a, B_PANIC, T_PANIC );
			move( a );
			}
		    break;
		    }
		}
	    }
	}
    }

static void
move( a )
    int a;
    {
    int x, y, d, nx, ny, fx, fy;

    x = ants[a].x;
    y = ants[a].y;
    d = ants[a].dir;
    nx = x + dx[d];
    ny = y + dy[d];

    if ( nx < 0 || nx >= world_w || ny < 0 || ny >= world_h )
	{
	/* Hit an edge.  Turn. */
	turn( a );
	return;
	}

    if ( world[ny][nx] != E_AIR )
	{
	/* Hit dirt or sand.  Dig? */
	if ( ants[a].behavior == B_WANDERING && ants[a].y >= surface &&
	     ( world[ny][nx] == E_SAND ||
	       random() % 1000 < CONCAVE_BELOW_DIRT_DIG_PROB ) )
	    /* Yes, try digging. */
	    (void) try_dig( a, 1 );
	else
	    /* Nope, no digging.  Turn. */
	    turn( a );
	return;
	}

    /* We can move forward.  But first, check footing. */
    fx = nx + dx[foot_dir[d]];
    fy = ny + dy[foot_dir[d]];
    if ( fx >= 0 && fx < world_w && fy >= 0 && fy < world_h &&
	 world[fy][fx] == E_AIR )
	{
	/* Whoops, we're over air.  Move into the air and turn towards
	** the feet.  But first, see if we should drop.
	*/
	if ( ants[a].behavior == B_CARRYING && ants[a].y < surface &&
	     random() % 1000 < CONVEX_ABOVE_DROP_PROB )
	    drop( a );
	nx = fx;
	ny = fy;
	ants[a].dir = foot_dir[d];
	}

    /* Ok. */
    invalidate_ant( a );
    ants[a].x = nx;
    ants[a].y = ny;
    invalidate_ant( a );
    }

static void
turn( a )
    int a;
    {
    int n, d, d2;
    int ok_dirs[N_DIRS];

    /* First check if turning "back" is ok. */
    d = back_dir[ants[a].dir];
    d2 = back_dir[d];
    if ( legal_dir( a, d ) )
	ants[a].dir = d;
    else if ( legal_dir( a, d2 ) )
	ants[a].dir = d2;
    else
	{
	/* Make a list of the legal directions. */
	n = 0;
	for ( d = 0; d < N_DIRS; ++d )
	    {
	    if ( d != ants[a].dir && legal_dir( a, d ) )
		{
		ok_dirs[n] = d;
		++n;
		}
	    }
	
	if ( n != 0 )
	    {
	    /* Choose a random legal direction. */
	    ants[a].dir = ok_dirs[random() % n];
	    }
	else
	    {
	    /* No legal directions to turn?  Trapped!  If we're carrying,
	    ** drop, then turn randomly.  Perhaps we can dig ourselves out.
	    */
	    if ( ants[a].behavior == B_CARRYING &&
		 ( world[ants[a].y][ants[a].x] == E_AIR ||
		   random() % 1000 < SAND_EXCLUSION_PROB ) )
		drop( a );
	    ants[a].dir = random() % N_DIRS;
	    }
	}
    invalidate_ant( a );
    }

static int
legal_dir( a, d )
    int a, d;
    {
    int nx, ny;

    /* Check that there's air ahead. */
    nx = ants[a].x + dx[d];
    ny = ants[a].y + dy[d];
    if ( nx < 0 || nx >= world_w || ny < 0 || ny >= world_h ||
	 world[ny][nx] != E_AIR )
	return 0;

    /* Check that there's solid footing. */
    nx = ants[a].x + dx[foot_dir[d]];
    ny = ants[a].y + dy[foot_dir[d]];
    if ( nx >= 0 && nx < world_w && ny >= 0 && ny < world_h &&
	 world[ny][nx] == E_AIR )
	return 0;

    return 1;
    }

static int
try_dig( a, forward )
    int a, forward;
    {
    int x, y;

    if ( forward )
	{
	x = ants[a].x + dx[ants[a].dir];
	y = ants[a].y + dy[ants[a].dir];
	}
    else
	{
	x = ants[a].x + dx[foot_dir[ants[a].dir]];
	y = ants[a].y + dy[foot_dir[ants[a].dir]];
	}

    if ( x >= 0 && x < world_w && y >= 0 && y < world_h &&
	 world[y][x] != E_AIR )
	{
	world[y][x] = E_AIR;
	invalidate( x, y, 1, 1 );
	loosen_neighbors( x, y );
	behave( a, B_CARRYING, T_CARRYING );
	return 1;
	}
    else
	return 0;
    }

static void
loosen_neighbors( xc, yc )
    int xc, yc;
    {
    int x, y;

    for ( y = yc + 2; y >= yc - 2; --y )
	for ( x = xc - 2; x <= xc + 2; ++x )
	    if ( ( x != xc || y != yc ) &&
		 x >= 0 && x < world_w && y >= 0 && y < world_h &&
		 world[y][x] == E_SAND )
		loosen_one( x, y );
    }

static void
loosen_one( x, y )
    int x, y;
    {
    int i;

    /* Check if there's already loose sand at this location. */
    for ( i = 0; i < num_falling_sands; ++i )
	if ( falling_sands[i].active &&
	     falling_sands[i].x == x && falling_sands[i].y == y )
	    return;

    /* Try to store the new sand in an old position. */
    for ( i = 0; i < num_falling_sands; ++i )
	if ( ! falling_sands[i].active )
	    {
	    falling_sands[i].x = x;
	    falling_sands[i].y = y;
	    falling_sands[i].active = 1;
	    return;
	    }

    /* See if we need to expand to make room for the new sand. */
    if ( num_falling_sands == max_falling_sands )
	{
	if ( max_falling_sands == 0 )
	    {
	    max_falling_sands = 32;
	    falling_sands = (falling_sand*) malloc(
		(unsigned) ( max_falling_sands * sizeof(falling_sand) ) );
	    }
	else
	    {
	    max_falling_sands *= 2;
	    falling_sands = (falling_sand*) realloc(
		(char*) falling_sands,
		(unsigned) ( max_falling_sands * sizeof(falling_sand) ) );
	    }
	if ( falling_sands == (falling_sand*) 0 )
	    {
	    (void) fprintf( stderr, "%s: out of memory\n", argv0 );
	    exit( 1 );
	    }
	}

    /* Add it. */
    falling_sands[num_falling_sands].x = x;
    falling_sands[num_falling_sands].y = y;
    falling_sands[num_falling_sands].active = 1;
    ++num_falling_sands;
    }

static void
drop( a )
    int a;
    {
    world[ants[a].y][ants[a].x] = E_SAND;
    invalidate( ants[a].x, ants[a].y, 1, 1 );
    loosen_one( ants[a].x, ants[a].y );
    behave( a, B_WANDERING, T_WANDERING );
    }

static void
behave( a, behavior, timer )
    int a, behavior, timer;
    {
    ants[a].behavior = behavior;
    ants[a].timer = timer + random() % 3 - 1;
    }

static void
sand_fall()
    {
    int i, j, x, y, gotone, tipl, tipr;

    gotone = 0;
    for ( i = 0; i < num_falling_sands; ++i )
	if ( falling_sands[i].active )
	{
	gotone = 1;
	x = falling_sands[i].x;
	y = falling_sands[i].y;
	if ( y + 1 >= world_h )
	    {
	    /* Hit bottom - done falling and no compaction possible. */
	    falling_sands[i].active = 0;
	    continue;
	    }

	/* Drop the sand onto the next lower sand or dirt. */
	if ( world[y + 1][x] == E_AIR )
	    {
	    falling_sands[i].y = y + 1;
	    world[y][x] = E_AIR;
	    world[falling_sands[i].y][falling_sands[i].x] = E_SAND;
	    invalidate( x, y, 1, 1 );
	    invalidate( falling_sands[i].x, falling_sands[i].y, 1, 1 );
	    loosen_neighbors( x, y );
	    continue;
	    }
	
	/* Tip over an edge? */
	tipl = ( x - 1 >= 0 && y + 2 < world_h &&
		 world[y][x - 1] == E_AIR &&
		 world[y + 1][x - 1] == E_AIR &&
		 world[y + 2][x - 1] == E_AIR );
	tipr = ( x + 1 < world_w && y + 2 < world_h &&
		 world[y][x + 1] == E_AIR &&
		 world[y + 1][x + 1] == E_AIR &&
		 world[y + 2][x + 1] == E_AIR );
	if ( tipl || tipr )
	    {
	    if ( tipl && tipr )
		{
		if ( random() % 2 == 0 )
		    tipl = 0;
		else
		    tipr = 0;
		}
	    if ( tipl )
		falling_sands[i].x = x - 1;
	    else
		falling_sands[i].x = x + 1;
	    falling_sands[i].y = y + 1;
	    world[y][x] = E_AIR;
	    world[falling_sands[i].y][falling_sands[i].x] = E_SAND;
	    invalidate( x, y, 1, 1 );
	    invalidate( falling_sands[i].x, falling_sands[i].y, 1, 1 );
	    loosen_neighbors( x, y );
	    continue;
	    }

	/* Found the final resting place. */
	falling_sands[i].active = 0;

	/* Compact sand into dirt. */
	for ( j = 0; y + 1 < world_h && world[y+1][x] == E_SAND; ++y, ++j )
	    ;
	if ( j >= COMPACT )
	    {
	    world[y][x] = E_DIRT;
	    invalidate( x, y, 1, 1 );
	    }
	}
    if ( ! gotone )
	num_falling_sands = 0;
    }

static int
read_world( cf )
    char* cf;
    {
    FILE* cfP;
    char* buf[500];
    int w, h, x, y, c;

    cfP = fopen( cf, "r" );
    if ( cfP == (FILE*) 0 )
	return 0;

    if ( fgets( buf, sizeof(buf), cfP ) == (char*) 0 )
	{
	(void) fprintf(
	    stderr, "%s: error reading checkpoint file %s\n", argv0, cf );
	exit( 1 );
	}
    if ( strcmp( buf, "xantfarm\n" ) != 0 )
	{
	(void) fprintf(
	    stderr, "%s: %s is not a valid checkpoint file\n", argv0, cf );
	exit( 1 );
	}
    if ( fgets( buf, sizeof(buf), cfP ) == (char*) 0 )
	{
	(void) fprintf(
	    stderr, "%s: error reading checkpoint file %s\n", argv0, cf );
	exit( 1 );
	}
    if ( sscanf( buf, "%d %d", &w, &h ) != 2 )
	{
	(void) fprintf(
	    stderr, "%s: error reading checkpoint file %s\n", argv0, cf );
	exit( 1 );
	}
    if ( w != world_w || h != world_h )
	{
	(void) fprintf(
	    stderr,
	    "%s: checkpoint file %s has the wrong size for this screen\n",
	    argv0, cf );
	exit( 1 );
	}

    for ( y = 0; y < h; ++y )
	for ( x = 0; x < w; ++x )
	    {
	    for (;;)
		{
		c = getc( cfP );
		if ( c == EOF )
		    {
		    (void) fprintf(
			stderr, "%s: EOF reading checkpoint file %s\n",
			argv0, cf );
		    exit( 1 );
		    }
		switch ( c )
		    {
		    case 'A':
		    world[y][x] = E_AIR;
		    goto next;;
		    case 'D':
		    world[y][x] = E_DIRT;
		    goto next;;
		    case 'S':
		    world[y][x] = E_SAND;
		    goto next;;
		    case ' ':
		    case '\t':
		    case '\n':
		    case '\r':
		    break;
		    default:
		    (void) fprintf(
			stderr,
			"%s: unknown character reading checkpoint file %s\n",
			argv0, cf );
		    exit( 1 );
		    }
		}
	    next: continue;
	    }

    (void) fclose( cfP );
    return 1;
    }

static void
write_world( fP )
    FILE* fP;
    {
    int x, y, c;

    rewind( fP );
    (void) fprintf( fP, "xantfarm\n" );
    (void) fprintf( fP, "%d %d\n", world_w, world_h );
    for ( y = 0; y < world_h; ++y )
	{
	c = 0;
	for ( x = 0; x < world_w; ++x )
	    {
	    if ( c >= 78 )
		{
		(void) putc( '\n', fP );
		c = 0;
		}
	    switch ( world[y][x] )
		{
		case E_AIR:
		(void) putc( 'A', fP );
		break;
		case E_SAND:
		(void) putc( 'S', fP );
		break;
		case E_DIRT:
		(void) putc( 'D', fP );
		break;
		}
	    ++c;
	    }
	(void) putc( '\n', fP );
	}
    (void) fflush( fP );
    }
