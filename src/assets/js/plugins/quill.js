'use strict';

import Quill from 'quill/core';

import { AlignClass } from 'quill/formats/align';
import Blockquote from 'quill/formats/blockquote';

import { FontClass } from 'quill/formats/font';
import { SizeClass } from 'quill/formats/size';

import Bold from 'quill/formats/bold';
import Italic from 'quill/formats/italic';
import Link from 'quill/formats/link';
import Strike from 'quill/formats/strike';
import Underline from 'quill/formats/underline';
import Header from 'quill/formats/header';

import Image from 'quill/formats/image';
import Video from 'quill/formats/video';

import Toolbar from 'quill/modules/toolbar';

import List, { ListItem } from 'quill/formats/list';

Quill.register({
    'formats/align': AlignClass,

    'formats/font': FontClass,
    'formats/size': SizeClass,

    'formats/blockquote': Blockquote,
    'formats/header': Header,
    'formats/list': List,
    'formats/list-item': ListItem,

    'formats/bold': Bold,
    'formats/italic': Italic,
    'formats/link': Link,
    'formats/strike': Strike,
    'formats/underline': Underline,

    'formats/image': Image,
    'formats/video': Video,

    'modules/toolbar': Toolbar,
}, true);


export default Quill;